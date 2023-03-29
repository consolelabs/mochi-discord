import { userMention } from "@discordjs/builders"
import defi from "adapters/defi"
import profile from "adapters/profile"
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
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { ResponseMonikerConfigData } from "types/api"
import {
  KafkaNotificationMessage,
  KafkaQueueActivityDataCommand,
  RunResult,
} from "types/common"
import { getExitButton } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { defaultActivityMsg, sendActivityMsg } from "utils/activity"
import { parseDiscordToken } from "utils/commands"
import {
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import {
  MOCHI_ACTION_TIP,
  MOCHI_PAY_SERVICE,
  MOCHI_PLATFORM_DISCORD,
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
} from "utils/constants"
import { reply } from "utils/discord"
import { sendNotificationMsg } from "utils/kafka"
import {
  classifyTipSyntaxTargets,
  getToken,
  isTokenSupported,
  parseMonikerinCmd,
  parseRecipients,
} from "utils/tip-bot"
import mochiPay from "../../../adapters/mochi-pay"
import { getProfileIdByDiscord } from "../../../utils/profile"
import * as processor from "./processor"
import { validateBalance } from "../../../utils/defi"

export async function tip(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
) {
  // const fullCmd = args.join(SPACE)
  const author = getAuthor(msgOrInteraction)
  const onchain = args.at(-1) === "--onchain"
  args = args.slice(0, onchain ? -1 : undefined) // remove --onchain if any

  // check currency is moniker or supported
  const { newArgs: argsAfterParseMoniker, moniker } = await parseMonikerinCmd(
    args,
    msgOrInteraction.guildId ?? ""
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
      msgOrInteraction,
    })
  }

  // check token supported
  const { cryptocurrency } = processor.parseTipParameters(agrsAfterParseMessage)
  const tokenSupported = await isTokenSupported(cryptocurrency)
  if (!moniker && !tokenSupported) {
    throw new InternalError({
      msgOrInteraction,
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
    msgOrInteraction,
    agrsAfterParseMessage,
    author.id,
    targets,
    moniker
  )
  let imageUrl = ""
  if (msgOrInteraction instanceof Message) {
    imageUrl = msgOrInteraction.attachments.first()?.url ?? ""
  }
  // payload.fullCommand = fullCmd
  // payload.image = imageUrl
  // payload.message = messageTip

  const profileId = await getProfileIdByDiscord(author.id)

  // check balance
  const {
    ok: bOk,
    data: bData,
    curl: bCurl,
    error: bError,
  } = await mochiPay.getBalances({
    profileId,
  })
  if (!bOk) {
    throw new APIError({
      msgOrInteraction,
      curl: bCurl,
      error: bError,
    })
  }
  let currentBal = 0
  let rate = 0
  bData?.forEach((bal: any) => {
    if (equalIgnoreCase(payload.token, bal.token?.symbol)) {
      currentBal = bal.balances
      rate = bal.rate_in_usd
    }
  })
  if (currentBal < payload.originalAmount) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: {
        current: currentBal,
        required: payload.originalAmount,
        symbol: payload.token,
      },
    })
  }
  // ask for confirmation for payload > 100usd
  let response: RunResult<MessageOptions>
  if (payload.originalAmount * rate >= 100) {
    response = await confirmToTip(
      msgOrInteraction,
      payload,
      targets,
      payload.recipients,
      messageTip,
      imageUrl,
      onchain,
      rate,
      moniker
    )
  } else {
    response = await executeTip(
      msgOrInteraction,
      payload,
      targets,
      messageTip,
      imageUrl,
      onchain,
      moniker
    )
  }

  // TODO(trkhoi): generic to make every feature can use this
  const dataProfile = await profile.getByDiscord(author.id)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msgOrInteraction,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }

  for (const recipient of payload.recipients) {
    // send activity message
    const recipientUsername =
      msgOrInteraction?.guild?.members.cache.get(recipient)

    const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
      dataProfile.id,
      MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      MOCHI_PAY_SERVICE,
      MOCHI_ACTION_TIP
    )
    const amountEveryRecipient =
      payload.originalAmount / payload.recipients.length
    kafkaMsg.activity.content.username =
      recipientUsername?.user.username.toString()
    kafkaMsg.activity.content.amount = amountEveryRecipient.toString()
    kafkaMsg.activity.content.token = payload.token
    sendActivityMsg(kafkaMsg)

    //get discord id
    let recipientId = recipient.replace("<@", "")
    recipientId = recipientId.replace(">", "")
    // send notification message
    const kafkaNotiMsg: KafkaNotificationMessage = {
      id: author.id,
      platform: MOCHI_PLATFORM_DISCORD,
      action: MOCHI_ACTION_TIP,
      metadata: {
        amount: amountEveryRecipient.toString(),
        token: payload.token,
      },
      recipient_info: {
        discord: recipientId,
      },
    }

    sendNotificationMsg(kafkaNotiMsg)
  }

  await reply(msgOrInteraction, response)
}

export function parseTipParameters(args: string[]) {
  const each = args[args.length - 1].toLowerCase() === "each"
  args = each ? args.slice(0, args.length - 1) : args
  const cryptocurrency = args[args.length - 1].toUpperCase()
  const amountArg = args[args.length - 2].toLowerCase()
  return { each, cryptocurrency, amountArg }
}

export async function getTipPayload(
  msgOrInteraction: Message | CommandInteraction,
  args: string[],
  authorId: string,
  targets: string[],
  moniker?: ResponseMonikerConfigData
) {
  // parse token and amount
  const {
    each: eachParse,
    cryptocurrency,
    amountArg,
  } = parseTipParameters(args)
  // get sender and recipients data
  const sender = await getProfileIdByDiscord(authorId)
  const discordIds = await parseRecipients(msgOrInteraction, targets, authorId)
  const recipients: string[] = []
  for (const discordId of discordIds) {
    const profileId = await getProfileIdByDiscord(discordId)
    recipients.push(profileId)
  }

  // check if only tip author
  if (targets.length === 1 && targets[0] === `<@${authorId}>`) {
    throw new DiscordWalletTransferError({
      discordId: authorId,
      message: msgOrInteraction,
      error: "Users cannot tip themselves!",
    })
  }
  // check if recipient is valid or not
  if (!recipients?.length) {
    throw new DiscordWalletTransferError({
      discordId: authorId,
      message: msgOrInteraction,
      error: "No valid recipient was found!",
    })
  }

  // validate tip amount, just allow: number (1, 2, 3.4, 5.6) or string("all")
  let amount = parseFloat(amountArg)
  if (
    (isNaN(amount) || amount <= 0) &&
    !["all", "a", "an"].includes(amountArg)
  ) {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msgOrInteraction,
      error: "The amount is invalid. Please insert a natural number.",
    })
  }
  if (amountArg === "a" || amountArg === "an") {
    amount = 1
  }
  const all = equalIgnoreCase(amountArg, "all")
  const each = eachParse && !all
  amount = each ? amount * recipients.length : amount
  if (moniker) {
    amount *= (moniker as ResponseMonikerConfigData).moniker?.amount ?? 1
  }

  // validate balance
  const { balance } = await validateBalance({
    msgOrInteraction,
    token: cryptocurrency,
    amount,
  })
  if (all) {
    amount = balance
  }

  const token = await getToken(cryptocurrency)

  return {
    sender: getAuthor(msgOrInteraction).id,
    recipients: targets,
    from: {
      profile_global_id: `${sender}`,
      platform: "discord",
    },
    tos: recipients.map((r) => ({
      profile_global_id: `${r}`,
      platform: "discord",
    })),
    amount: Array(recipients.length).fill(`${amount / recipients.length}`),
    originalAmount: amount,
    token: cryptocurrency,
    token_id: token.id,
    note: "",
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

async function confirmToTip(
  msg: Message | CommandInteraction,
  payload: any,
  targets: string[],
  recipientIds: string[],
  messageTip: string,
  imageUrl: string,
  onchain: boolean,
  rate: number,
  moniker?: ResponseMonikerConfigData
): Promise<RunResult<MessageOptions>> {
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
      payload.originalAmount
    } ${payload.token.toUpperCase()}** ($${(
      payload.originalAmount * rate
    ).toFixed(2)}) to tip ${
      recipientIds.length == 1
        ? `<@${recipientIds[0]}>`
        : recipientIds.length + " users"
    }?`,
    color: msgColors.BLUE,
  })
  const confirmHandler = async () => {
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
      handler: confirmHandler,
      options: {
        filter: (i) => i.customId === "confirm-tip" && i.user.id === authorId,
        max: 1,
      },
    },
  }
}

export async function executeTip(
  msgOrInteraction: Message | CommandInteraction,
  payload: any,
  targets: string[],
  messageTip: string,
  imageUrl: string,
  onchain: boolean,
  moniker?: ResponseMonikerConfigData
): Promise<RunResult<MessageOptions>> {
  // transfer
  // TODO: temporarily disable onchain tip
  // onchain = false
  // const transfer = (req: any) =>
  //   onchain ? defi.submitOnchainTransfer(req) : mochiPay.transfer(req)
  const { status } = await mochiPay.transfer(payload)
  if (status !== 200) {
    throw new APIError({
      msgOrInteraction,
      curl: "",
      description: `[transfer] failed with status ${status}`,
    })
  }

  // const recipientIds: string[] = data.map((tx: any) => tx.recipient_id)
  // const users = recipientIds.map((id) => userMention(id)).join(", ")
  const users = payload.recipients.join(", ")
  const isOnline = targets.includes("online")
  const hasRole = targets.some((t) => parseDiscordToken(t).isRole)
  const hasChannel = targets.some((t) => parseDiscordToken(t).isChannel)
  let recipientDescription = users
  if (hasRole || hasChannel || isOnline) {
    recipientDescription = `**${payload.recipients.length}${
      isOnline ? ` online` : ""
    } user(s)${payload.recipients.length >= 10 ? "" : ` (${users})`}**${
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
    +payload.amount[0],
    4
  )} ${payload.token}** (\u2248 $${roundFloatNumber(
    payload.amount_in_usd ?? 0,
    4
  )}) ${payload.recipients.length > 1 ? "each" : ""}`
  if (moniker) {
    const monikerVal = moniker as ResponseMonikerConfigData
    const amountMoniker = roundFloatNumber(
      payload.amount[0] /
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
      payload.amount_in_usd ?? 0,
      4
    )}) ${payload.recipients.length > 1 ? "each" : ""}`
  }
  if (messageTip) {
    description += ` with message\n\n${getEmoji("conversation")} ${messageTip}`
  }
  const embed = composeEmbedMessage(null, {
    thumbnail: thumbnails.TIP,
    author: ["Tips", getEmojiURL(emojis.COIN)],
    description: description,
    color: msgColors.SUCCESS,
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
