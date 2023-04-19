import { userMention } from "@discordjs/builders"
import { CommandInteraction, Message, SelectMenuInteraction } from "discord.js"
import { InternalError } from "errors"
import { APIError } from "errors/api"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
  TokenEmojiKey,
} from "utils/common"
import { isMessage, reply } from "utils/discord"
import {
  getTargets,
  parseMessageTip,
  parseMoniker,
  parseRecipients,
} from "utils/tip-bot"
import defi from "../../../adapters/defi"
import mochiPay from "../../../adapters/mochi-pay"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { convertString } from "../../../utils/convert"
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

  // each: optional param | go after unit (if any)
  const eachIdx = unitIdx + 1
  const each = args[eachIdx] === "each"

  // message go after each, if no each then after unit
  const messageIdx = (each ? eachIdx : unitIdx) + 1
  const message = parseMessageTip(args, messageIdx)

  // image
  const { message: msg } = isMessage(msgOrInteraction)
  const image = msg ? msg.attachments.first()?.url ?? "" : ""

  // check if unit is a moniker
  const moniker = await parseMoniker(unit, msgOrInteraction.guildId ?? "")
  const amount = parsedAmount * (moniker?.moniker?.amount ?? 1)

  // symbol
  const symbol = (moniker?.moniker?.token?.token_symbol ?? unit).toUpperCase()

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

  // one one matching token -> proceed to send tip
  if (balances.length === 1) {
    const balance = balances[0]
    const current = +balance.amount / Math.pow(10, balance.token?.decimal ?? 0)
    if (current < amount) {
      throw new InsufficientBalanceError({
        msgOrInteraction,
        params: { current, required: amount, symbol: symbol as TokenEmojiKey },
      })
    }
    payload.chain_id = balance.token?.chain?.chain_id
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
      .join(", ")}.\nnPlease select one of the following`,
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
    const current = roundFloatNumber(
      convertString(balance?.amount, balance?.token?.decimal) ?? 0,
      4
    )
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
  )} has sent ${recipientDescription} **${roundFloatNumber(
    +data.amount_each,
    4
  )} ${payload.token}** (\u2248 $${roundFloatNumber(usdAmount ?? 0, 4)}) ${
    payload.recipients.length > 1 ? "each" : ""
  }`
  if (payload.message) {
    description += ` with message\n\n${getEmoji("ANIMATED_CHAT", true)} ${
      payload.message
    }`
  }
  const embed = composeEmbedMessage(null, {
    thumbnail: getEmojiURL(emojis.CASH),
    author: ["Tips", getEmojiURL(emojis.COIN)],
    description,
    color: msgColors.SUCCESS,
  })
  if (payload.image) {
    embed.setImage(payload.image)
  }

  return { messageOptions: { embeds: [embed], components: [] } }
}
