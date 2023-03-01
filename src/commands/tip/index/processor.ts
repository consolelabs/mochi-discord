import { userMention } from "@discordjs/builders"
import defi from "adapters/defi"
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageOptions,
} from "discord.js"
import { MessageButtonStyles } from "discord.js/typings/enums"
import { InternalError } from "errors"
import { APIError } from "errors/api"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { ResponseMonikerConfigData } from "types/api"
import { MultipleResult, RunResult } from "types/common"
import { OffchainTipBotTransferRequest } from "types/defi"
import { getExitButton } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import {
  classifyTipSyntaxTargets,
  parseMonikerinCmd,
  parseRecipients,
  tipTokenIsSupported,
} from "utils/tip-bot"
import * as processor from "./processor"

export async function handleTip(
  args: string[],
  authorId: string,
  fullCmd: string,
  msg: Message | CommandInteraction
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  const onchain = args.at(-1) === "--onchain"
  args = args.slice(0, onchain ? -1 : undefined) // remove --onchain if any

  // check currency is moniker or supported
  const { newArgs: argsAfterParseMoniker, moniker } = await parseMonikerinCmd(
    args,
    msg.guildId ?? ""
  )

  // parse tip message
  const { newArgs: agrsAfterParseMessage, messageTip } =
    await processor.parseMessageTip(argsAfterParseMoniker)

  const newCmd = agrsAfterParseMessage.join(" ").trim()
  const { isValid, targets } = classifyTipSyntaxTargets(
    newCmd
      .split(" ")
      .slice(1, newCmd.toLowerCase().endsWith("each") ? -3 : -2)
      .join(" ")
  )

  if (!isValid) {
    throw new InternalError({
      title: "Incorrect recipients",
      description:
        "Mochi cannot find the recipients. Type @ to choose valid roles or usernames!",
      message: msg,
    })
  }

  // check token supported
  const { cryptocurrency } = processor.parseTipParameters(agrsAfterParseMessage)
  if (!moniker && !(await tipTokenIsSupported(cryptocurrency))) {
    throw new InternalError({
      message: msg,
      title: "Unsupported token",
      description: `**${cryptocurrency.toUpperCase()}** hasn't been supported.\n${getEmoji(
        "POINTINGRIGHT"
      )} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${getEmoji(
        "POINTINGRIGHT"
      )}.`,
    })
  }

  // preprocess command arguments
  const payload = await processor.getTipPayload(
    msg,
    agrsAfterParseMessage,
    authorId,
    targets
  )
  if (moniker) {
    payload.amount *=
      (moniker as ResponseMonikerConfigData).moniker?.amount ?? 1
  }
  let imageUrl = ""
  if (msg instanceof Message) {
    imageUrl = msg.attachments.first()?.url ?? ""
  }
  payload.fullCommand = fullCmd
  payload.image = imageUrl
  payload.message = messageTip

  // check balance
  const {
    ok: bOk,
    data: bData,
    curl: bCurl,
    error: bError,
  } = await defi.offchainGetUserBalances({
    userId: payload.sender,
  })
  if (!bOk) {
    throw new APIError({ message: msg, curl: bCurl, error: bError })
  }
  let currentBal = 0
  let rate = 0
  bData?.forEach((bal: any) => {
    if (payload.token.toUpperCase() === bal.symbol.toUpperCase()) {
      currentBal = bal.balances
      rate = bal.rate_in_usd
    }
  })
  if (currentBal < payload.amount && !payload.all) {
    return {
      messageOptions: {
        embeds: [
          defi.composeInsufficientBalanceEmbed(
            msg,
            currentBal,
            payload.amount,
            payload.token
          ),
        ],
      },
    }
  }
  // ask for confirmation for payload > 100usd
  if (payload.amount * rate >= 100) {
    return await executeTipWithConfirmation(
      msg,
      payload,
      payload.recipients,
      messageTip,
      imageUrl,
      onchain,
      rate,
      moniker
    )
  } else {
    return await executeTip(
      msg,
      payload,
      payload.recipients,
      messageTip,
      imageUrl,
      onchain,
      moniker
    )
  }
}

export function parseTipParameters(args: string[]) {
  const each = args[args.length - 1].toLowerCase() === "each"
  args = each ? args.slice(0, args.length - 1) : args
  const cryptocurrency = args[args.length - 1].toUpperCase()
  const amountArg = args[args.length - 2].toLowerCase()
  return { each, cryptocurrency, amountArg }
}

export async function getTipPayload(
  msg: Message | CommandInteraction,
  args: string[],
  authorId: string,
  targets: string[]
): Promise<OffchainTipBotTransferRequest> {
  const type = args[0]
  const sender = authorId
  let recipients: string[] = []

  const guildId = msg.guildId ?? "DM"

  // parse recipients
  const {
    each: eachParse,
    cryptocurrency,
    amountArg,
  } = parseTipParameters(args)
  recipients = await parseRecipients(msg, targets, sender)

  // check if only tip author
  if (targets.length === 1 && targets[0] === `<@${authorId}>`) {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msg,
      error: "Users cannot tip themselves!",
    })
  }
  // check if recipient is valid or not
  if (!recipients || !recipients.length) {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msg,
      error: "No valid recipient was found!",
    })
  }

  // check recipients exist in discord server or not
  for (const recipientId of recipients) {
    const user = await msg.guild?.members.fetch(recipientId)
    if (!user) {
      throw new DiscordWalletTransferError({
        discordId: sender,
        message: msg,
        error: `User <@${recipientId}> not found`,
      })
    }
  }

  // validate tip amount, just allow: number (1, 2, 3.4, 5.6) or string("all")
  let amount = parseFloat(amountArg)
  if (
    (isNaN(amount) || amount <= 0) &&
    !["all", "a", "an"].includes(amountArg)
  ) {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msg,
      error: "The amount is invalid. Please insert a natural number.",
    })
  }
  if (amountArg === "a" || amountArg === "an") {
    amount = 1
  }
  const each = eachParse && amountArg !== "all"
  amount = each ? amount * recipients.length : amount

  return {
    sender,
    recipients,
    guildId,
    channelId: msg.channelId,
    amount,
    token: cryptocurrency,
    each,
    all: amountArg === "all",
    transferType: type ?? "",
    duration: 0,
    fullCommand: "",
  }
}

export async function parseMessageTip(args: string[]) {
  const { ok, data, log, curl } = await defi.getAllTipBotTokens()
  if (!ok) {
    throw new APIError({ description: log, curl })
  }
  let tokenIdx = -1
  if (data && Array.isArray(data) && data.length !== 0) {
    data.forEach((token: any) => {
      const idx = args.findIndex(
        (element) => element.toLowerCase() === token.token_symbol.toLowerCase()
      )
      if (idx !== -1) {
        tokenIdx = idx
      }
    })
  }
  let messageTip = ""
  let newArgs = args
  if (tokenIdx !== -1 && args.length > tokenIdx + 1) {
    const messageTipArr = args.slice(tokenIdx + 1)
    newArgs = args.slice(0, tokenIdx + 1)
    if (args[tokenIdx + 1].toLowerCase() === "each") {
      messageTipArr.shift()
      newArgs.push(args[tokenIdx + 1])
    }
    messageTip = messageTipArr
      .join(" ")
      .replaceAll('"', "")
      .replaceAll("”", "")
      .replaceAll("“", "")
      .replaceAll("'", "")
      .trim()
  }
  return {
    newArgs,
    messageTip,
  }
}

async function executeTipWithConfirmation(
  msg: Message | CommandInteraction,
  payload: OffchainTipBotTransferRequest,
  targets: string[],
  messageTip: string,
  imageUrl: string,
  onchain: boolean,
  rate: number,
  moniker?: ResponseMonikerConfigData
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  const authorId = msg instanceof Message ? msg.author.id : msg.user.id
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: "confirm-tip",
      style: MessageButtonStyles.SUCCESS,
      label: "Confirm",
      emoji: getEmoji("APPROVE"),
    }),
    getExitButton(payload.sender)
  )
  const confirmEmbed = composeEmbedMessage(null, {
    title: `${getEmoji("TIP")} Transaction Confirmation`,
    description: `Are you sure you want to spend **${
      payload.amount
    } ${payload.token.toUpperCase()}** (${(payload.amount * rate).toFixed(
      2
    )} USD) to tip ${
      targets.length == 1 ? `<@${targets[0]}>` : targets.length + " users"
    }?`,
  })
  const confirmButtonCollectorHandler = async () => {
    return await executeTip(
      msg,
      payload,
      targets,
      messageTip,
      imageUrl,
      onchain,
      moniker
    )
  }
  return {
    messageOptions: {
      embeds: [confirmEmbed],
      components: [actionRow],
    },
    buttonCollector: {
      handler: confirmButtonCollectorHandler,
      options: {
        filter: (i) => i.customId === "confirm-tip" && i.user.id === authorId,
        max: 1,
      },
    },
  }
}

async function executeTip(
  msg: Message | CommandInteraction,
  payload: OffchainTipBotTransferRequest,
  targets: string[],
  messageTip: string,
  imageUrl: string,
  onchain: boolean,
  moniker?: ResponseMonikerConfigData
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  // transfer
  const transfer = (req: any) =>
    onchain
      ? defi.submitOnchainTransfer(req)
      : defi.offchainDiscordTransfer(req)
  const { data, ok, error, curl, log } = await transfer(payload)
  if (!ok) {
    throw new APIError({ message: msg, curl, description: log, error })
  }

  const recipientIds: string[] = data.map((tx: any) => tx.recipient_id)
  const users = recipientIds.map((id) => userMention(id)).join(", ")
  const isOnline = targets.includes("online")
  const hasRole = targets.some((t) => parseDiscordToken(t).isRole)
  const hasChannel = targets.some((t) => parseDiscordToken(t).isChannel)
  let recipientDescription = users
  if (hasRole || hasChannel || isOnline) {
    recipientDescription = `**${data.length}${
      isOnline ? ` online` : ""
    } user(s)${data.length >= 20 ? "" : ` (${users})`}**${
      isOnline && !hasRole && !hasChannel
        ? ""
        : ` in ${targets
            .filter((t) => t.toLowerCase() !== "online")
            .filter(
              (t) =>
                parseDiscordToken(t).isChannel || parseDiscordToken(t).isRole
            )
            .join(", ")}`
    }`
  }
  let description = `${userMention(
    payload.sender
  )} has sent ${recipientDescription} **${roundFloatNumber(
    data[0].amount,
    4
  )} ${payload.token}** (\u2248 $${roundFloatNumber(
    data[0].amount_in_usd,
    4
  )}) ${recipientIds.length > 1 ? "each" : ""}`
  if (moniker) {
    const monikerVal = moniker as ResponseMonikerConfigData
    const amountMoniker = roundFloatNumber(
      payload.amount /
        (payload.recipients.length * (monikerVal?.moniker?.amount || 1)),
      4
    )
    description = `${userMention(
      payload.sender
    )} has sent ${recipientDescription} **${amountMoniker} ${
      monikerVal?.moniker?.moniker
    }** (= **${roundFloatNumber(
      amountMoniker * (monikerVal?.moniker?.amount || 1),
      4
    )} ${monikerVal?.moniker?.token?.token_symbol}** \u2248 $${roundFloatNumber(
      data[0].amount_in_usd,
      4
    )}) ${recipientIds.length > 1 ? "each" : ""}`
  }
  if (messageTip) {
    description += ` with message\n\n${getEmoji(
      "conversation"
    )} **${messageTip}**`
  }
  const embed = composeEmbedMessage(null, {
    thumbnail: thumbnails.TIP,
    author: ["Tips", getEmojiURL(emojis.COIN)],
    description: description,
  })
  if (imageUrl) {
    embed.setImage(imageUrl)
  }

  return {
    messageOptions: {
      embeds: [embed],
      components: [],
    },
  }
}
