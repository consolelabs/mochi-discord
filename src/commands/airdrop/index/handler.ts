import { utils as mochiUtils } from "@consolelabs/mochi-ui"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { wrapError } from "utils/wrap-error"
import defi from "../../../adapters/defi"
import { APIError } from "../../../errors"
import { RunResult } from "../../../types/common"
import { AirdropOptions, TransferPayload } from "../../../types/transfer"
import { composeEmbedMessage } from "../../../ui/discord/embed"
import { parseDiscordToken } from "../../../utils/commands"
import {
  TokenEmojiKey,
  defaultEmojis,
  emojis,
  equalIgnoreCase,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
} from "../../../utils/common"
import { APPROX } from "../../../utils/constants"
import { formatDigit } from "../../../utils/defi"
import { airdropCache, validateAndShowConfirmation } from "./processor"
import { getMaximumRecipients } from "../../../utils/tip-bot"
import * as qrcode from "qrcode"
import mochiPay from "adapters/mochi-pay"
import { getProfileIdByDiscord } from "utils/profile"
import { dmUser } from "../../../utils/dm"

dayjs.extend(duration)
dayjs.extend(relativeTime)

export function confirmationHandler(
  payload: TransferPayload,
  opts: AirdropOptions,
) {
  return async (i: ButtonInteraction) => {
    switch (i.customId) {
      case "confirm_airdrop":
        return confirmAirdrop(i, payload, opts)
      case "cancel_airdrop":
        return cancelAirdrop(i)
      default:
        return
    }
  }
}

function cancelAirdrop(i: ButtonInteraction): RunResult<MessageOptions> {
  const embed = composeEmbedMessage(null, {
    title: "Airdrop canceled",
    description: "Your airdrop was successfully canceled.",
    originalMsgAuthor: i.user,
  })
  return { messageOptions: { embeds: [embed], components: [] } }
}

async function generateQRairdrop(
  i: ButtonInteraction,
  embed: MessageEmbed,
  createAirdropParams: {
    profileId: string
    token: string
    amount: number
    entries?: number
    duration: number
    chain_id: string
  },
): Promise<RunResult<MessageOptions>> {
  const res = await mochiPay.generateQRpaymentCode(createAirdropParams)
  if (!res.ok || !res.data?.id)
    throw new APIError({
      curl: res.curl,
      description: res.log,
      error: res.error ?? "",
      status: res.status ?? 500,
      msgOrInteraction: i,
    })
  const buffer = await qrcode.toBuffer(
    `https://mochi.gg/airdrop/${res.data.id}`,
    {
      width: 400,
    },
  )

  embed.setImage("attachment://qr.png")

  return {
    messageOptions: {
      files: [new MessageAttachment(buffer, "qr.png")],
      components: [],
      embeds: [embed],
    },
  }
}

async function confirmAirdrop(
  i: ButtonInteraction,
  payload: TransferPayload,
  opts: AirdropOptions,
): Promise<RunResult<MessageOptions>> {
  await i.deferUpdate()

  const { duration, entries, useQR } = opts

  const author = i.user
  opts.authorName = author.username
  const { amount, token, token_price = 0 } = payload
  const usdAmount = token_price * amount
  const tokenEmoji = getEmojiToken(token as TokenEmojiKey)
  const endTime = dayjs().add(+duration, "second").toDate()
  opts.endTime = endTime
  const fmtCountdownTime = `<t:${dayjs(endTime).unix()}:R>`
  const airdropEmbed = composeEmbedMessage(null, {
    title: `${getEmoji("AIRDROP")} An airdrop appears`,
    description: `${author} left an airdrop${
      entries
        ? ` for ${
            entries && entries > 1 ? `${entries} people each` : "1 person"
          }`
        : ""
    } with ${tokenEmoji} **${formatDigit({
      value: amount.toString(),
    })} ${token}** (${APPROX} $${roundFloatNumber(
      usdAmount,
      4,
    )}) ${fmtCountdownTime}.`,
    footer: ["Ends"],
    timestamp: endTime,
    originalMsgAuthor: author,
    color: msgColors.BLUE,
  })

  if (useQR) {
    const profileId = await getProfileIdByDiscord(i.user.id)
    airdropEmbed.setDescription(
      `${author} left an airdrop${
        entries
          ? ` for ${
              entries && entries > 1 ? `${entries} people each` : "1 person"
            }`
          : ""
      } with ${tokenEmoji} **${formatDigit({
        value: amount.toString(),
      })} ${token}** (${APPROX} $${roundFloatNumber(
        usdAmount,
        4,
      )}) ${fmtCountdownTime}.`,
    )
    return await generateQRairdrop(i, airdropEmbed, {
      amount,
      token,
      profileId,
      duration,
      chain_id: payload.chain_id,
      ...(typeof entries === "number" ? { entries } : {}),
    })
  }

  const cacheKey = `airdrop-${i.message.id}`
  airdropCache.set(cacheKey, [], opts.duration)

  opts.entries =
    opts.entries || getMaximumRecipients(payload.amount, payload.decimal ?? 18)

  await checkExpiredAirdrop(i, cacheKey, payload, opts)

  const buttonRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `enter_airdrop`,
      label: "Enter airdrop",
      style: "SECONDARY",
      emoji: getEmoji("ANIMATED_PARTY_POPPER", true),
    }),
  )

  return {
    messageOptions: { embeds: [airdropEmbed], components: [buttonRow] },
    buttonCollector: {
      handler: entranceHandler(opts, author, cacheKey),
      options: { filter: undefined, max: undefined },
    },
  }
}

async function checkExpiredAirdrop(
  i: ButtonInteraction,
  cacheKey: string,
  payload: TransferPayload,
  opts: AirdropOptions,
) {
  const { token, amount_string = "", token_price = 0 } = payload
  const amount = +amount_string
  const usdAmount = amount * token_price

  const msg = i.message as Message
  let ref: Message | CommandInteraction = await msg.fetchReference()
  if (ref?.interaction?.type === "APPLICATION_COMMAND") {
    ref = ref.interaction as CommandInteraction
  }

  airdropCache.on("expired", (key, participants: string[]) => {
    wrapError(ref, async () => {
      if (key !== cacheKey) {
        return
      }

      // remove cache
      airdropCache.del(key)

      // avoid race condition, num. of participants might exceed max entries
      if (opts.entries) participants = participants.slice(0, opts.entries)

      const tokenEmoji = getEmojiToken(token as TokenEmojiKey)
      const embed = composeEmbedMessage(null, {
        title: `${getEmoji("AIRDROP")} An airdrop appears`,
        footer: [`${participants.length} users joined, ended`],
        originalMsgAuthor: i.user,
      })
      // edit original msg
      const msg = i.message as Message
      // if no one joins airdrop, no transfer happens
      if (!participants?.length) {
        const description = `${
          i.user
        }'s airdrop of ${tokenEmoji} **${amount} ${token}** (${APPROX} $${roundFloatNumber(
          usdAmount,
          4,
        )}) has not been collected by anyone ${getEmoji(
          "ANIMATED_SHRUGGING",
          true,
        )}.`
        embed.setDescription(description)
        msg.edit({ embeds: [embed], components: [] })
        return
      }

      // there are participants(s)
      // proceed to transfer
      payload.recipients = participants.map((p) => parseDiscordToken(p).value)
      const {
        data,
        ok,
        curl,
        log,
        status = 500,
      } = await defi.transferV2({
        ...payload,
        sender: await getProfileIdByDiscord(payload.sender),
        recipients: await Promise.all(
          payload.recipients.map((r: string) => getProfileIdByDiscord(r)),
        ),
        platform: "discord",
      })
      if (!ok) {
        await msg
          .edit({
            embeds: [
              composeEmbedMessage(null, {
                author: ["Airdrop error", getEmojiURL(emojis.REVOKE)],
                description:
                  "This airdrop encountered an error, please try again later",
                color: msgColors.ERROR,
              }),
            ],
            components: [],
          })
          .catch(() => null)

        throw new APIError({
          msgOrInteraction: i,
          description: log,
          curl,
          status,
        })
      }

      // send airdrop results to author
      sendAuthorDm(i, participants, data, payload)

      const description = `${
        i.user
      }'s airdrop of ${tokenEmoji} **${amount} ${token}** (${APPROX} $${roundFloatNumber(
        usdAmount,
        4,
      )}) has been collected by ${participants.join(",")}!`
      embed.setDescription(description)
      msg.edit({ embeds: [embed], components: [] })
    })
  })
}

function sendAuthorDm(
  i: ButtonInteraction,
  participants: string[],
  data: any,
  payload: TransferPayload,
) {
  const { amount, token, token_price = 0 } = payload
  const usdAmount = token_price * amount
  const usdEach = usdAmount / participants.length
  const emojis = [
    getEmoji("PROPOSAL"),
    getEmoji("NFT"),
    getEmoji("NFT"),
    getEmoji("SHARE"),
    getEmoji("WEB"),
  ]
  const txId = data.tx_id ?? ""
  const totalAmount = `${getEmoji(
    token as TokenEmojiKey,
  )} **${mochiUtils.formatTokenDigit(
    payload.amount,
  )} ${token}** (${mochiUtils.formatUsdDigit(usdAmount)})`

  const allocation = `${getEmoji(
    token as TokenEmojiKey,
  )} **${mochiUtils.formatTokenDigit(
    data.amount_each,
  )} ${token}** (${mochiUtils.formatUsdDigit(usdEach)}) each`

  const fmtUsers = participants.join(",")
  const receiver = `**${participants.length} ${
    participants.length === 1 ? "user" : "users"
  }** (${fmtUsers})`

  const channel = `<#${payload.channel_id}>`
  const info = [
    `${emojis[0]} \`TxID.         \` ${txId}`,
    `${emojis[1]} \`Total Amount. \` ${totalAmount}`,
    `${emojis[2]} \`Allocation..  \` ${allocation}`,
    `${emojis[3]} \`Receiver.     \` ${receiver}`,
    `${emojis[4]} \`Channel.      \` ${channel}`,
  ]
  const description = info.join("\n")
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("AIRDROP")} Your airdrop ended`,
    description,
    color: msgColors.SUCCESS,
  })

  // send dm
  dmUser({ embeds: [embed] }, i.user, null, i)
}

/*
 * Triggerred whenever a user enters airdrop
 */
async function enterAirdrop(
  i: ButtonInteraction,
  opts: AirdropOptions,
  author: User,
  cacheKey: string,
) {
  const participants: string[] = airdropCache.get(cacheKey) ?? []

  const isAuthor = author.id === i.user.id
  // author tries to join their own airdrop
  if (isAuthor) {
    await i.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(null, {
          title: `${defaultEmojis.ERROR} Airdrop error`,
          description: "Users cannot enter their own airdrops!",
          originalMsgAuthor: i.user,
        }),
      ],
    })
    return
  }

  const alreadyJoined = participants.includes(i.user.toString())
  // user tries to join an airdrop twice
  if (alreadyJoined) {
    await i.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(null, {
          author: ["Could not enter airdrop", getEmojiURL(emojis.REVOKE)],
          description: "You have already joined this airdrop!",
          originalMsgAuthor: i.user,
        }),
      ],
    })
    return
  }

  if (opts.entries && participants.length > opts.entries) {
    await i.reply({
      ephemeral: true,
      embeds: [
        composeEmbedMessage(null, {
          author: ["Could not enter airdrop", getEmojiURL(emojis.REVOKE)],
          description: "There's no slot left to join this airdrop!",
        }),
      ],
    })
    return
  }

  // new joiner (valid)
  participants.push(i.user.toString())
  const airdropAuthor = opts.authorName ?? "Unknown"
  const fmtCountdownTime = `<t:${dayjs(opts.endTime).unix()}:R>`
  const replyEmbed = composeEmbedMessage(null, {
    title: `${getEmoji("CHECK")} You have joined ${airdropAuthor}'s airdrop`,
    description: `You will receive ${airdropAuthor}'s airdrop ${fmtCountdownTime}.`,
    footer: ["You will only receive this notification once"],
    color: msgColors.SUCCESS,
  })

  await Promise.all([
    dmUser({ embeds: [replyEmbed] }, i.user, null, null),
    i.reply({
      ephemeral: true,
      embeds: [replyEmbed],
    }),
  ])
  if (opts.entries && participants.length === opts.entries) {
    airdropCache.emit("expired", cacheKey, participants)
  }
}

export function entranceHandler(
  opts: AirdropOptions,
  author: User,
  cacheKey: string,
) {
  return async (i: ButtonInteraction) =>
    await enterAirdrop(i, opts, author, cacheKey)
}

export function tokenSelectionHandler(
  ci: CommandInteraction,
  payload: TransferPayload,
  balances: any,
  opts: AirdropOptions,
) {
  return async (i: SelectMenuInteraction) => {
    await i.deferUpdate()
    payload.chain_id = i.values[0]
    const balance = balances.find(
      (b: any) =>
        equalIgnoreCase(b.token?.symbol, payload.token) &&
        payload.chain_id === b.token?.chain?.chain_id,
    )
    return validateAndShowConfirmation(ci, payload, balance, opts)
  }
}
