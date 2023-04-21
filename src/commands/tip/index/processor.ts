import { userMention } from "@discordjs/builders"
import { CommandInteraction, Message, SelectMenuInteraction } from "discord.js"
import { InternalError } from "errors"
import { APIError } from "errors/api"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
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
} from "utils/common"
import { isMessage, reply } from "utils/discord"
import {
  getTargets,
  isTokenSupported,
  parseMessageTip,
  parseMoniker,
  parseRecipients,
} from "utils/tip-bot"
import defi from "../../../adapters/defi"
import mochiPay from "../../../adapters/mochi-pay"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { APPROX } from "../../../utils/constants"
import { convertString } from "../../../utils/convert"
import { formatDigit, isNaturalNumber } from "../../../utils/defi"
import { getProfileIdByDiscord } from "../../../utils/profile"

export async function tip(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
) {
  const author = getAuthor(msgOrInteraction)
  const onchain = args.at(-1) === "--onchain"
  args = args.slice(0, onchain ? -1 : undefined) // remove --onchain if any

  const { valid, targets, lastIdx: lastTargetIdx } = await getTargets(args)
  if (!valid) {
    throw new InternalError({
      title: "Incorrect recipients",
      description:
        "Mochi cannot find the recipients. Type @ to choose valid roles or usernames!",
      msgOrInteraction,
    })
  }

  // amount: go after targets
  const amountIdx = lastTargetIdx + 1
  const { amount: parsedAmount, all } = await parseAmount(
    msgOrInteraction,
    args[amountIdx]
  )

  // unit: go after amount
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
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    const errorEmbed = getErrorEmbed({
      title: "Unsupported token",
      description: `**${symbol}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
    reply(msgOrInteraction, { messageOptions: { embeds: [errorEmbed] } })
    return
  }

  // each: optional param | go after unit (if any)
  const eachIdx = unitIdx + 1
  const each = args[eachIdx] === "each"

  // message go after each, if no each then after unit
  const messageIdx = (each ? eachIdx : unitIdx) + 1
  const message = parseMessageTip(args, messageIdx)

  // image
  const { message: msg } = isMessage(msgOrInteraction)
  const image = msg ? msg.attachments.first()?.url ?? "" : ""

  // get sender balances
  const senderPid = await getProfileIdByDiscord(author.id)
  const { data, ok, curl, log } = await mochiPay.getBalances({
    profileId: senderPid,
    token: symbol,
  })
  if (!ok) {
    throw new APIError({ curl, description: log, msgOrInteraction })
  }

  const balances = data.filter((b: any) => b.amount !== "0")

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

  const payload: any = {
    sender: author.id,
    targets,
    recipients,
    platform: "discord",
    guild_id: msgOrInteraction.guildId ?? "",
    channel_id: msgOrInteraction.channelId,
    amount,
    token: symbol,
    each,
    all,
    transfer_type: "tip",
    message,
    image,
  }

  // only one matching token -> proceed to send tip
  if (balances.length === 1) {
    const balance = balances[0]
    const decimal = balance.token?.decimal ?? 0
    const current = +balance.amount / Math.pow(10, decimal)
    if (current < amount) {
      throw new InsufficientBalanceError({
        msgOrInteraction,
        params: { current, required: amount, symbol: symbol as TokenEmojiKey },
      })
    }
    if (!isNaturalNumber(amount * Math.pow(10, decimal))) {
      throw new DiscordWalletTransferError({
        message: msgOrInteraction,
        error: ` ${symbol} valid amount must not have more than ${decimal} fractional digits. Please try again!`,
      })
    }
    payload.chain_id = balance.token?.chain?.chain_id
    payload.amount_string = formatDigit(
      (all ? current : amount).toString(),
      decimal
    )
    const result = await executeTip(msgOrInteraction, payload, balance.token)
    await reply(msgOrInteraction, result)
    return
  }

  // found multiple tokens balance with given symbol -> ask for selection
  await selectTokenToTip(msgOrInteraction, balances, payload)
  return
}

async function selectTokenToTip(
  msgOrInteraction: Message | CommandInteraction,
  balances: any,
  payload: any
) {
  const author = getAuthor(msgOrInteraction)

  // select menu
  const selectRow = composeDiscordSelectionRow({
    customId: `tip-select-token`,
    placeholder: "Select a token",
    options: balances.map((b: any) => {
      const chain = b.token?.chain?.name
      return {
        label: `${b.token.name} ${chain ? `(${chain})` : ""}`,
        value: b.token.chain.chain_id,
      }
    }),
  })

  // embed
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: author,
    author: ["Multiple results found", getEmojiURL(emojis.MAG)],
    description: `You have \`${
      payload.token
    }\` balance on multiple chains: ${balances
      .map((b: any) => {
        return `\`${b.token?.chain?.name}\``
      })
      .filter((s: any) => Boolean(s))
      .join(", ")}.\nPlease select one of the following`,
  })

  // select-menu handler
  const suggestionHandler = async (i: SelectMenuInteraction) => {
    await i.deferUpdate()
    payload.chain_id = i.values[0]
    const balance = balances.find(
      (b: any) =>
        equalIgnoreCase(b.token?.symbol, payload.token) &&
        payload.chain_id === b.token?.chain?.chain_id
    )
    const decimal = balance.token?.decimal ?? 0
    const current = convertString(balance?.amount, decimal) ?? 0
    if (current < payload.amount) {
      throw new InsufficientBalanceError({
        msgOrInteraction,
        params: {
          current,
          required: payload.amount,
          symbol: payload.token,
        },
      })
    }
    if (!isNaturalNumber(payload.amount * Math.pow(10, decimal))) {
      throw new DiscordWalletTransferError({
        message: msgOrInteraction,
        error: ` ${payload.token} valid amount must not have more than ${decimal} fractional digits. Please try again!`,
      })
    }
    payload.amount_string = formatDigit(
      (payload.all ? current : payload.amount).toString(),
      decimal
    )
    return await executeTip(msgOrInteraction, payload, balance?.token)
  }

  // reply
  reply(msgOrInteraction, {
    messageOptions: { embeds: [embed], components: [selectRow] },
    selectMenuCollector: { handler: suggestionHandler },
  })
}

async function parseAmount(
  msgOrInteraction: Message | CommandInteraction,
  amountArg: string
): Promise<{ all: boolean; amount: number }> {
  const author = getAuthor(msgOrInteraction)
  const result = {
    all: false,
    amount: parseFloat(amountArg),
  }
  switch (true) {
    // a, an = 1
    case ["a", "an"].includes(amountArg.toLowerCase()):
      result.amount = 1
      break

    // tip all, let BE calculate amount
    case equalIgnoreCase("all", amountArg):
      result.amount = 0
      result.all = true
      break

    // invalid amount
    case isNaN(result.amount) || result.amount <= 0:
      throw new DiscordWalletTransferError({
        discordId: author.id,
        message: msgOrInteraction,
        error: "The amount is invalid. Please insert a natural number.",
      })
  }

  return result
}

async function executeTip(
  msgOrInteraction: Message | CommandInteraction,
  payload: any,
  token: any
) {
  const { data, ok, curl, log } = await defi.offchainDiscordTransfer(payload)
  if (!ok) {
    throw new APIError({ msgOrInteraction, curl, description: log })
  }
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
  const usdAmount = data.amount_each * token?.price
  let description = `${userMention(
    payload.sender
  )} has sent ${recipientDescription} **${formatDigit(
    data.amount_each.toString(),
    18
  )} ${payload.token}** (${APPROX} $${formatDigit(usdAmount.toString())}) ${
    payload.recipients.length > 1 ? "each" : ""
  }`
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
