import { userMention } from "@discordjs/builders"
import {
  CommandInteraction,
  Message,
  MessageOptions,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { APIError } from "errors/api"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  TokenEmojiKey,
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
  msgColors,
  thumbnails,
  roundFloatNumber,
} from "utils/common"
import { isMessage, reply } from "utils/discord"
import {
  getBalances,
  getTargets,
  isInTipRange,
  isTokenSupported,
  parseMessageTip,
  parseMoniker,
  parseRecipients,
  parseTipAmount,
} from "utils/tip-bot"
import defi from "../../../adapters/defi"
import { UnsupportedTokenError } from "../../../errors/unsupported-token"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { APPROX } from "../../../utils/constants"
import { convertString } from "../../../utils/convert"
import { formatDigit, isValidTipAmount } from "../../../utils/defi"
import { RunResult } from "../../../types/common"
import { TransferPayload } from "../../../types/transfer"

export async function tip(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
) {
  if (!msgOrInteraction.guildId) {
    throw new GuildIdNotFoundError({ message: msgOrInteraction })
  }

  const author = getAuthor(msgOrInteraction)
  const onchain = equalIgnoreCase(args.at(-1), "--onchain")
  args = args.slice(0, onchain ? -1 : undefined) // remove --onchain if any

  const { targets, amount, symbol, each, all, message, image } =
    await parseTipArgs(msgOrInteraction, args)

  // get sender balances
  const balances = await getBalances({ msgOrInteraction, token: symbol })

  // no balance -> reject
  if (!balances.length) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: { current: 0, required: amount, symbol: symbol as TokenEmojiKey },
    })
  }

  // recipients discord ids
  const recipients = await parseRecipients(msgOrInteraction, targets, author.id)
  if (!recipients.length) {
    throw new DiscordWalletTransferError({
      discordId: author.id,
      error: "No valid recipients found",
      message: msgOrInteraction,
    })
  }

  const payload: TransferPayload = {
    sender: author.id,
    targets: [...new Set(targets)],
    recipients: [...new Set(recipients)],
    guild_id: msgOrInteraction.guildId ?? "",
    channel_id: msgOrInteraction.channelId,
    amount,
    token: symbol,
    each,
    all,
    transfer_type: "tip",
    message,
    image,
    chain_id: "",
  }

  // only one matching token -> proceed to send tip
  if (balances.length === 1) {
    const balance = balances[0]
    const result = await validateAndTransfer(msgOrInteraction, payload, balance)
    await reply(msgOrInteraction, result)
    return
  }

  // found multiple tokens balance with given symbol -> ask for selection
  await selectToken(msgOrInteraction, balances, payload)
  return
}

async function selectToken(
  msgOrInteraction: Message | CommandInteraction,
  balances: any,
  payload: any
) {
  const author = getAuthor(msgOrInteraction)

  // token selection handler
  const suggestionHandler = async (i: SelectMenuInteraction) => {
    await i.deferUpdate()
    payload.chain_id = i.values[0]
    const balance = balances.find(
      (b: any) =>
        equalIgnoreCase(b.token?.symbol, payload.token) &&
        payload.chain_id === b.token?.chain?.chain_id
    )
    return validateAndTransfer(msgOrInteraction, payload, balance)
  }

  // show token selection
  await reply(msgOrInteraction, {
    ...composeTokenSelectionResponse(author, balances),
    selectMenuCollector: { handler: suggestionHandler },
  })
}

function composeTokenSelectionResponse(
  author: User,
  balances: any
): RunResult<MessageOptions> {
  const options = balances.map((b: any) => {
    return {
      label: `${b.token.name} (${b.token?.chain?.name ?? b.token?.chain_id})`,
      value: b.token.chain.chain_id,
    }
  })
  // select menu
  const selectRow = composeDiscordSelectionRow({
    customId: `tip-select-token`,
    placeholder: "Select a token",
    options,
  })

  // embed
  const chains = balances
    .map((b: any) => {
      return `\`${b.token?.chain?.name}\``
    })
    .filter((s: any) => Boolean(s))
    .join(", ")
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: author,
    author: ["Multiple results found", getEmojiURL(emojis.MAG)],
    description: `You have \`${balances[0].token?.symbol}\` balance on multiple chains: ${chains}.\nPlease select one of the following`,
  })

  return { messageOptions: { embeds: [embed], components: [selectRow] } }
}

async function transfer(
  msgOrInteraction: Message | CommandInteraction,
  payload: any
) {
  // send transfer request
  const { data, ok, curl, log } = await defi.offchainDiscordTransfer(payload)
  if (!ok) {
    throw new APIError({ msgOrInteraction, curl, description: log })
  }

  // respond with successful message
  return showSuccesfulResponse(payload, data)
}

function showSuccesfulResponse(
  payload: any,
  res: any
): RunResult<MessageOptions> {
  const users = payload.targets.join(", ")
  const isOnline = payload.targets.includes("online")
  const hasRole = payload.targets.some(
    (t: string) => parseDiscordToken(t).isRole
  )
  const hasChannel = payload.targets.some(
    (t: string) => parseDiscordToken(t).isChannel
  )
  let recipientDescription = users
  if (hasRole || hasChannel || isOnline) {
    recipientDescription = `**${payload.recipients.length}${
      isOnline ? ` online` : ""
    } user(s)${payload.recipients.length >= 10 ? "" : ` (${users})`}**${
      isOnline && !hasRole && !hasChannel
        ? ""
        : ` in ${payload.targets
            .filter((t: string) => t.toLowerCase() !== "online")
            .filter(
              (t: string) =>
                parseDiscordToken(t).isChannel || parseDiscordToken(t).isRole
            )
            .join(", ")}`
    }`
  }
  let description = `${userMention(
    payload.sender
  )} has sent ${recipientDescription} **${formatDigit(
    res.amount_each.toString(),
    18
  )} ${payload.token}** (${APPROX} $${roundFloatNumber(
    payload.usd_amount,
    4
  )}) ${payload.recipients.length > 1 ? "each" : ""}`
  if (payload.message) {
    description += ` with message\n\n${getEmoji("ANIMATED_CHAT", true)} ${
      payload.message
    }`
  }
  const embed = composeEmbedMessage(null, {
    thumbnail: thumbnails.TIP,
    author: ["Tips", getEmojiURL(emojis.CASH)],
    description,
    color: msgColors.SUCCESS,
  })
  if (payload.image) {
    embed.setImage(payload.image)
  }

  return { messageOptions: { embeds: [embed], components: [] } }
}

async function parseTipArgs(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
): Promise<{
  targets: string[]
  amount: number
  symbol: string
  message: string
  image: string
  each: boolean
  all: boolean
}> {
  const { valid, targets, lastIdx: lastTargetIdx } = getTargets(args)
  if (!valid) {
    throw new InternalError({
      title: "Incorrect recipients",
      description:
        "Mochi cannot find the recipients. Type @ to choose valid roles or usernames!",
      msgOrInteraction,
    })
  }

  // amount: comes after targets
  const amountIdx = lastTargetIdx + 1
  const { amount: parsedAmount, all } = await parseTipAmount(
    msgOrInteraction,
    args[amountIdx]
  )

  // unit: comes after amount
  const unitIdx = amountIdx + 1
  const unit = args[unitIdx]

  // check if unit is a valid token ...
  const isToken = await isTokenSupported(unit)
  let moniker
  // if not then it could be a moniker
  if (!isToken) {
    moniker = await parseMoniker(unit, msgOrInteraction.guildId ?? "")
  }
  const amount = parsedAmount * (moniker?.moniker?.amount ?? 1)
  const symbol = (moniker?.moniker?.token?.token_symbol ?? unit).toUpperCase()

  // if unit is not either a token or a moniker -> reject
  if (!moniker && !isToken) {
    throw new UnsupportedTokenError({ msgOrInteraction, symbol })
  }

  // each (optional): comes after unit
  const eachIdx = unitIdx + 1
  const each = args[eachIdx] === "each"

  // message comes after each, if no each then after unit
  const messageIdx = (each ? eachIdx : unitIdx) + 1
  const message = parseMessageTip(args, messageIdx)

  // image
  const { message: msg } = isMessage(msgOrInteraction)
  const image = msg ? msg.attachments.first()?.url ?? "" : ""

  return { targets, amount, symbol, each, message, all, image }
}

async function validateAndTransfer(
  msgOrInteraction: Message | CommandInteraction,
  payload: TransferPayload,
  balance: any
) {
  const decimal = balance.token?.decimal ?? 0
  const current = convertString(balance?.amount, decimal) ?? 0

  // validate balance
  if (current < payload.amount) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: {
        current,
        required: payload.amount,
        symbol: payload.token as TokenEmojiKey,
      },
    })
  }
  payload.amount = payload.all ? current : payload.amount

  // validate maximum fraction digits of amount
  if (!isValidTipAmount(payload.amount.toString(), decimal)) {
    throw new DiscordWalletTransferError({
      message: msgOrInteraction,
      error: ` ${payload.token} valid amount must not have more than ${decimal} fractional digits. Please try again!`,
    })
  }

  // validate tip range
  const usdAmount = payload.amount * balance.token?.price
  await isInTipRange(msgOrInteraction, usdAmount)

  // proceed to transfer
  payload.chain_id = balance.token?.chain?.chain_id
  payload.amount_string = formatDigit(payload.amount.toString(), decimal)
  payload.usd_amount = usdAmount
  return transfer(msgOrInteraction, payload)
}
