import { userMention } from "@discordjs/builders"
import community from "adapters/community"
import mochiPay from "adapters/mochi-pay"
import profile from "adapters/profile"
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageOptions,
  MessageSelectMenu,
} from "discord.js"
import { MessageButtonStyles } from "discord.js/typings/enums"
import { APIError, InternalError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { ResponseMonikerConfigData } from "types/api"
import { KafkaNotificationMessage, RunResult } from "types/common"
import {
  EMPTY_FIELD,
  composeEmbedMessage,
  composeMyWalletSelection,
} from "ui/discord/embed"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import {
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
  thumbnails,
} from "utils/common"
import { MOCHI_ACTION_TIP } from "utils/constants"
import { reply } from "utils/discord"
import { sendNotificationMsg } from "utils/kafka"
import { getToken, isTokenSupported, parseMonikerinCmd } from "utils/tip-bot"

function parseTipParameters(args: string[]) {
  const each = args[args.length - 1].toLowerCase() === "each"
  args = each ? args.slice(0, args.length - 1) : args
  const cryptocurrency = args[args.length - 1].toUpperCase()
  const amountArg = args[args.length - 2].toLowerCase()
  return { each, cryptocurrency, amountArg }
}

export async function parseMessageTip(args: string[]) {
  const { ok, data, log, curl } = await mochiPay.getTokens({})
  if (!ok) {
    throw new APIError({ description: log, curl })
  }
  let tokenIdx = -1
  if (data && Array.isArray(data) && data.length) {
    data.forEach((token: any) => {
      const idx = args.findIndex((element) =>
        equalIgnoreCase(element, token.symbol)
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

async function getTipPayload(
  msg: Message | CommandInteraction,
  args: string[],
  authorId: string,
  targets: string[],
  moniker?: ResponseMonikerConfigData
) {
  // parse recipients
  const {
    each: eachParse,
    cryptocurrency,
    amountArg,
  } = parseTipParameters(args)

  // check if recipient is valid or not
  const recipients: string[] = []
  for (const [i, target] of targets.entries()) {
    // TODO: handle for case not have username telegram
    const { data, ok, curl, error, log } =
      await community.getTelegramByUsername(target)
    if (!ok) {
      throw new APIError({ curl, error, description: log })
    }

    const recipientPf = await profile.getByTelegram(data.chat_id)
    if (recipientPf.status_code === 404) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Username not found",
        description: `We couldn't find username or id \`${target}\`. Check the username you entered or try again.`,
      })
    }
    if (recipientPf.err) {
      throw new APIError({
        msgOrInteraction: msg,
        description: `[getByTelegram] failed with status ${recipientPf.status_code}: ${recipientPf.err}`,
        curl: "",
      })
    }
    recipients[i] = recipientPf.id
  }

  const senderPf = await profile.getByDiscord(authorId)
  if (senderPf.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${senderPf.status_code}`,
      curl: "",
    })
  }
  const sender = senderPf.id

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
  if (moniker) {
    amount *= (moniker as ResponseMonikerConfigData).moniker?.amount ?? 1
  }

  const token = await getToken(cryptocurrency)

  return {
    sender: getAuthor(msg).id,
    recipients: targets,
    from: {
      profile_global_id: `${sender}`,
      platform: "discord",
    },
    tos: recipients.map((r) => ({
      profile_global_id: `${r}`,
      platform: "telegram",
    })),
    amount: Array(recipients.length).fill(`${amount / recipients.length}`),
    originalAmount: amount,
    token: cryptocurrency,
    token_id: token.id,
    note: "",
  }
}

async function confirmToTip(
  msg: Message | CommandInteraction,
  payload: any
): Promise<RunResult<MessageOptions>> {
  const author = getAuthor(msg)
  const buttonRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: "confirm_tip",
      style: MessageButtonStyles.PRIMARY,
      label: "Confirm",
      disabled: true,
    }),
    new MessageButton({
      customId: `exit-${author.id}`,
      emoji: getEmoji("revoke"),
      style: MessageButtonStyles.SECONDARY,
      label: "Cancel",
    })
  )
  const options = await composeMyWalletSelection(author.id)
  const selectionRow = composeDiscordSelectionRow({
    customId: "tip_select_wallet",
    placeholder: "Select a wallet to tip",
    options,
  })
  const tokenEmoji = getEmoji(payload.token)
  const embed = composeEmbedMessage(null, {
    author: ["Tip to telegram", getEmojiURL(emojis.APPROVE)],
    description: `**Recipient** [\`https://t.me/${payload.recipients[0]}\`](https://t.me/${payload.recipients[0]})`,
    thumbnail: thumbnails.TIP,
  }).addFields(
    {
      name: "Amount",
      value: `${tokenEmoji} ${payload.originalAmount} ${payload.token}`,
      inline: true,
    },
    EMPTY_FIELD,
    { name: "Social", value: "Telegram\n\u200B", inline: true },
    ...(payload.note
      ? [
          {
            name: `Message ${getEmoji("ANIMATED_CHAT", true)}`,
            value: `\`\`\`${payload.note}\`\`\``,
          },
        ]
      : [])
  )

  return {
    messageOptions: {
      embeds: [embed],
      components: [selectionRow, buttonRow],
    },
    buttonCollector: {
      options: {
        filter: (i) =>
          i.customId.startsWith("confirm_tip") && i.user.id === author.id,
        max: 1,
      },
      handler: () => execute(msg, payload),
    },
    selectMenuCollector: {
      options: {
        filter: (i) =>
          i.customId === "tip_select_wallet" && i.user.id === author.id,
      },
      handler: async (i) => {
        await i.deferUpdate()
        const confirmBtn = buttonRow.components.find(
          (c) => c.customId === "confirm_tip"
        )
        const selected = i.values[0]
        if (!selected.startsWith("mochi_") || !confirmBtn)
          return // selectionRow.components.find(c => c.customId === selected)?.
        ;(selectionRow.components[0] as MessageSelectMenu).options.forEach(
          (opt) => (opt.default = opt.value === selected)
        )
        confirmBtn.disabled = false
        return {
          messageOptions: {
            embeds: [embed],
            components: [selectionRow, buttonRow],
          },
        }
      },
    },
  }
}

export async function execute(
  msgOrInteraction: Message | CommandInteraction,
  payload: any
): Promise<RunResult<MessageOptions>> {
  const { status: transferStatus } = await mochiPay.transfer(payload)
  if (transferStatus !== 200) {
    throw new APIError({
      msgOrInteraction,
      curl: "",
      description: `[transfer] failed with status ${transferStatus}`,
    })
  }

  // create pay link
  const res: any = await mochiPay.generatePaymentCode({
    profileId: payload.from.profile_global_id,
    amount: payload.originalAmount.toString(),
    token: payload.token,
    note: payload.note,
    type: "paylink",
  })

  if (!res.ok) {
    const { log: description, curl } = res
    throw new APIError({ msgOrInteraction, description, curl })
  }

  // send msg to mochi-notification
  for (const recipient of payload.recipients) {
    const { data, ok, curl, error, log } =
      await community.getTelegramByUsername(recipient)
    if (!ok) {
      throw new APIError({ curl, error, description: log })
    }

    const kafkaMsg: KafkaNotificationMessage = {
      id: payload.sender,
      platform: payload.from.platform,
      action: MOCHI_ACTION_TIP,
      note: payload.note,
      metadata: {
        amount: payload.originalAmount.toString(),
        token: payload.token,
        pay_link: `https://mochi.gg/pay/${res.data.code}`,
      },
      recipient_info: {
        telegram: data.chat_id.toString(),
      },
    }

    sendNotificationMsg(kafkaMsg)
  }

  const embed = composeEmbedMessage(null, {
    author: ["You've given a tip", getEmojiURL(emojis.TIP)],
    description: `Congrats! ${userMention(
      payload.sender
    )} has given a tip of ${getEmoji(payload.token)} ${
      payload.originalAmount
    } ${payload.token}`,
  })

  return {
    messageOptions: {
      embeds: [embed],
      components: [],
    },
  }
}

export async function tipTelegram(
  msgOrInteraction: Message | CommandInteraction,
  args: string[]
) {
  const targets = [args[1]]
  const author = getAuthor(msgOrInteraction)

  // check currency is moniker or supported
  const { newArgs: argsAfterParseMoniker, moniker } = await parseMonikerinCmd(
    args,
    msgOrInteraction.guildId ?? ""
  )

  // parse tip message
  const { newArgs: agrsAfterParseMessage, messageTip } = await parseMessageTip(
    argsAfterParseMoniker
  )

  // check token supported
  const { cryptocurrency } = parseTipParameters(agrsAfterParseMessage)
  const tokenSupported = await isTokenSupported(cryptocurrency)
  if (!moniker && !tokenSupported) {
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    throw new InternalError({
      msgOrInteraction,
      title: "Unsupported token",
      description: `**${cryptocurrency}** hasn't been supported.\n${[
        pointingright,
      ]} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright}.`,
    })
  }

  const payload = await getTipPayload(
    msgOrInteraction,
    agrsAfterParseMessage,
    author.id,
    targets,
    moniker
  )
  payload.note = messageTip

  // TODO: check balance with mochi-pay

  const response = await confirmToTip(msgOrInteraction, payload)
  await reply(msgOrInteraction, response)
}
