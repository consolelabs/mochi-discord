import { utils as mochiUtils } from "@consolelabs/mochi-ui"
import { utils } from "ethers"
import { userMention } from "@discordjs/builders"
import {
  CommandInteraction,
  Message,
  MessageOptions,
  SelectMenuInteraction,
  User,
  MessageMentions,
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
  getEmojiToken,
  getEmojiURL,
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
  truncateAmountDecimal,
  validateTipAmount,
} from "utils/tip-bot"
import defi from "../../../adapters/defi"
import config from "../../../adapters/config"
import { UnsupportedTokenError } from "../../../errors/unsupported-token"
import { RunResult } from "../../../types/common"
import { TransferPayload } from "../../../types/transfer"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { APPROX } from "../../../utils/constants"
import { getProfileIdByDiscord } from "../../../utils/profile"

export async function tip(
  msgOrInteraction: Message | CommandInteraction,
  args: string[],
) {
  if (!msgOrInteraction.guildId) {
    throw new GuildIdNotFoundError({ message: msgOrInteraction })
  }

  const author = getAuthor(msgOrInteraction)
  const onchain = equalIgnoreCase(args.at(-1), "--onchain")
  args = args.slice(0, onchain ? -1 : undefined) // remove --onchain if any

  const {
    targets,
    amount,
    symbol,
    each,
    all,
    message,
    image,
    moniker,
    originalAmount,
  } = await parseTipArgs(msgOrInteraction, args)

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
    transfer_type: "transfer",
    message,
    image,
    chain_id: "",
    moniker: "",
    platform: "discord",
    original_amount: originalAmount,
  }

  if (moniker !== undefined) {
    payload.moniker = moniker.moniker.moniker
    payload.chain_id = moniker.moniker?.token?.chain?.chain_id
  }

  // only one matching token -> proceed to send tip
  // if tip with moniker -> no need to select token
  if (balances.length === 1 || moniker !== undefined) {
    const balance = balances[0]
    const result = await validateAndTransfer(msgOrInteraction, payload, balance)
    await reply(msgOrInteraction, result)
    return
  }

  // found multiple tokens balance with given symbol -> ask for selection
  if (moniker === undefined) {
    await selectToken(msgOrInteraction, balances, payload)
  }

  return
}

export async function selectToken(
  msgOrInteraction: Message | CommandInteraction,
  balances: any,
  payload: any,
) {
  const author = getAuthor(msgOrInteraction)

  // token selection handler
  const suggestionHandler = async (i: SelectMenuInteraction) => {
    await i.deferUpdate()
    payload.chain_id = i.values[0]
    const balance = balances.find(
      (b: any) =>
        equalIgnoreCase(b.token?.symbol, payload.token) &&
        payload.chain_id === b.token?.chain?.chain_id,
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
  balances: any,
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
  payload: any,
) {
  // handle mention user
  const rawMessage = payload.message
  payload.message = await handleMessageMention(
    msgOrInteraction,
    payload.message,
  ) // just to store discord username to show in web

  // send transfer request
  const { data, ok, curl, log } = await defi.transferV2({
    ...payload,
    sender: await getProfileIdByDiscord(payload.sender),
    recipients: await Promise.all(
      payload.recipients.map((r: string) => getProfileIdByDiscord(r)),
    ),
  })
  if (!ok) {
    throw new APIError({ msgOrInteraction, curl, description: log })
  }

  const member = await msgOrInteraction.guild?.members.fetch(payload.sender)
  const senderStr =
    member?.nickname || member?.displayName || member?.user.username
  // respond with successful message
  payload.message = rawMessage // need assign back to show @user in discord response
  const hashtagTemplate = await handleMessageHashtag(payload.message)
  return showSuccesfulResponse(payload, data, senderStr, hashtagTemplate)
}

function showSuccesfulResponse(
  payload: any,
  res: any,
  senderStr?: string,
  hashtagTemplate?: any,
): RunResult<MessageOptions> {
  const users = payload.recipients.map((r: string) => `<@${r}>`).join(", ")
  const isOnline = payload.targets.includes("online")
  const hasRole = payload.targets.some(
    (t: string) => parseDiscordToken(t).isRole,
  )
  const hasChannel = payload.targets.some(
    (t: string) => parseDiscordToken(t).isChannel,
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
                parseDiscordToken(t).isChannel || parseDiscordToken(t).isRole,
            )
            .join(", ")}`
    }`
  }

  const unitCurrency = payload.moniker ? payload.moniker : payload.token
  const amountToken = `${getEmojiToken(
    payload.token,
  )} ${mochiUtils.formatTokenDigit({
    value: utils.formatUnits(res.amount_each.toString(), payload.decimal),
  })} ${payload.token}`
  const amountApproxMoniker = payload.moniker ? `${amountToken} ` : ""
  const amount = payload.moniker
    ? payload.original_amount
    : `${mochiUtils.formatTokenDigit({
        value: utils.formatUnits(res.amount_each.toString(), payload.decimal),
      })}`
  const emojiAmountWithCurrency = payload.moniker
    ? ""
    : getEmojiToken(payload.token)
  let amountWithCurrency = `${emojiAmountWithCurrency} ${amount} ${unitCurrency}`
  amountWithCurrency = amountWithCurrency.trim()

  const amountApprox = `(${amountApproxMoniker}${APPROX} $${roundFloatNumber(
    res.amount_each * payload.token_price,
    4,
  )})`

  let contentMsg = ``

  let description = `${getEmoji("PROPOSAL")}\`Tx ID.    ${
    res.tx_id ?? "N/A"
  }\`\n${getEmoji("NFT2")}\`Amount.   \`${getEmojiToken(
    payload.token,
  )} **${amountWithCurrency}** ${amountApprox} ${
    payload.recipients.length > 1 ? "each" : ""
  }\n${getEmoji("ANIMATED_MONEY", true)}\`Sender.   \`${userMention(
    payload.sender,
  )}\n${getEmoji("SHARE")}\`Receiver. \`${recipientDescription}`
  if (payload.message) {
    description += `\n${getEmoji("ANIMATED_ROBOT", true)}\`Message.  \`${
      payload.message
    }`
    contentMsg += `\n${getEmoji("ANIMATED_CHAT", true)}\`Message. \`${
      payload.message
    }`
  }

  const content = `${userMention(
    payload.sender,
  )} sent ${recipientDescription} **${amountWithCurrency}** ${amountApprox}${
    payload.recipients.length > 1 ? " each" : ""
  }! .${mochiUtils.string.receiptLink(res.external_id)}`

  if (hashtagTemplate) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: hashtagTemplate.product_hashtag.title,
            description: hashtagTemplate.product_hashtag.description.replace(
              "{.content}",
              content,
            ),
            image: hashtagTemplate.product_hashtag.image,
            color: hashtagTemplate.product_hashtag.color,
          }),
        ],
      },
    }
  }

  return {
    messageOptions: {
      content: `${content}${contentMsg}`,
      components: [],
    },
  }
}

export async function parseTipArgs(
  msgOrInteraction: Message | CommandInteraction,
  args: string[],
): Promise<{
  targets: string[]
  amount: number
  symbol: string
  message: string
  image: string
  each: boolean
  all: boolean
  moniker: any
  originalAmount: number
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
  const {
    amount: parsedAmount,
    all,
    unit: parsedUnit,
  } = parseTipAmount(msgOrInteraction, args[amountIdx])

  // unit: comes after amount
  let unitIdx = amountIdx + 1
  let unit = args[unitIdx]

  if (parsedUnit) {
    // skip 1
    unitIdx -= 1
    unit = parsedUnit
  }

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
  const each = args[eachIdx] === "each" && !all

  // message comes after each, if no each then after unit
  const messageIdx = (each ? eachIdx : unitIdx) + 1
  const message = parseMessageTip(args, messageIdx)

  // image
  const { message: msg } = isMessage(msgOrInteraction)
  const image = msg ? msg.attachments.first()?.url ?? "" : ""

  return {
    targets,
    amount,
    symbol,
    each,
    message,
    all,
    image,
    moniker,
    originalAmount: parsedAmount,
  }
}

async function handleMessageHashtag(msg: string) {
  const re = /#(\w+)/g
  let hashtagTemplate = null
  for (const match of msg.matchAll(re)) {
    const { data, ok } = await config.getHashtagTemplate(match[1])
    if (!ok || !data) {
      continue
    }
    hashtagTemplate = data
    break
  }
  return hashtagTemplate
}

async function handleMessageMention(
  msgOrInteraction: Message | CommandInteraction,
  msg: string,
) {
  const re = MessageMentions.USERS_PATTERN
  for (const match of msg.matchAll(re)) {
    const member = await msgOrInteraction.guild?.members.fetch(match[1])
    msg = msg.replace(match[0], member?.user.username ?? "")
  }
  return msg
}

export async function validateAndTransfer(
  msgOrInteraction: Message | CommandInteraction,
  payload: TransferPayload,
  balance: any,
) {
  const decimal = balance.token?.decimal ?? 0
  const current = +balance.amount / Math.pow(10, decimal)
  payload.decimal = decimal

  // validate balance
  if (current < payload.amount && !payload.all) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: {
        current,
        required: payload.amount,
        symbol: payload.token as TokenEmojiKey,
      },
    })
  }

  if (payload.all) {
    const truncated = truncateAmountDecimal(balance.amount)
    payload.amount = +truncated / Math.pow(10, decimal)
  } else {
    payload.amount = +payload.amount.toFixed(decimal)
  }
  payload.amount = +payload.amount.toFixed(decimal)

  validateTipAmount({
    msgOrInteraction,
    amount: payload.amount,
    decimal,
    numOfRecipients: payload.recipients.length,
  })

  // validate tip range
  const usdAmount = payload.amount * balance.token?.price
  await isInTipRange(msgOrInteraction, usdAmount)

  // proceed to transfer
  payload.chain_id = balance.token?.chain?.chain_id
  payload.amount_string = mochiUtils.formatTokenDigit({
    value: utils.formatUnits(payload.amount.toString(), decimal),
  })
  payload.token_price = balance.token?.price
  return transfer(msgOrInteraction, payload)
}
