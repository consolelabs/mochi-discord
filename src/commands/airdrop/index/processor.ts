import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageOptions,
  TextChannel,
} from "discord.js"
import NodeCache from "node-cache"
import parse from "parse-duration"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  TokenEmojiKey,
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
} from "utils/common"
import { APPROX } from "utils/constants"
import {
  getBalances,
  isInTipRange,
  isTokenSupported,
  parseMoniker,
  parseTipAmount,
  truncateAmountDecimal,
  validateTipAmount,
} from "utils/tip-bot"
import { InternalError } from "../../../errors"
import { InsufficientBalanceError } from "../../../errors/insufficient-balance"
import { UnsupportedTokenError } from "../../../errors/unsupported-token"
import { RunResult } from "../../../types/common"
import { AirdropOptions, TransferPayload } from "../../../types/transfer"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { formatDigit } from "../../../utils/defi"
import { getChannelUrl, reply } from "utils/discord"
import { confirmationHandler, tokenSelectionHandler } from "./handler"
import * as processor from "./processor"

dayjs.extend(duration)
dayjs.extend(relativeTime)

export const airdropCache = new NodeCache({
  stdTTL: 180,
  checkperiod: 1,
  useClones: false,
})

export async function airdrop(i: CommandInteraction) {
  const { amount, token, duration, entries, all, useQR } =
    await processor.getAirdropArgs(i)

  // get sender balances
  const balances = await getBalances({ msgOrInteraction: i, token })

  // no balance -> reject
  if (!balances.length) {
    throw new InsufficientBalanceError({
      msgOrInteraction: i,
      params: { current: 0, required: amount, symbol: token as TokenEmojiKey },
    })
  }

  const guildName = i.guild?.name ?? ""
  const guildAvatar = i.guild?.iconURL()
  const channel_url = await getChannelUrl(i)

  const payload: TransferPayload = {
    sender: i.user.id,
    recipients: [],
    platform: "discord",
    guild_id: i.guildId ?? "",
    channel_id: i.channelId,
    amount,
    token,
    all,
    transfer_type: "airdrop",
    chain_id: "",
    channel_name: guildName,
    channel_url,
    channel_avatar: guildAvatar,
  }

  // only one matching token -> proceed to send tip
  if (balances.length === 1) {
    const balance = balances[0]
    const output = await validateAndShowConfirmation(i, payload, balance, {
      duration,
      entries,
      useQR,
    })
    await reply(i, output)
    return
  }

  // found multiple tokens balance with given symbol -> ask for selection
  await selectToken(i, payload, balances, { duration, entries, useQR })
  return
}

export async function validateAndShowConfirmation(
  ci: CommandInteraction,
  payload: TransferPayload,
  balance: any,
  opts: AirdropOptions,
) {
  const decimal = balance.token?.decimal ?? 0
  payload.decimal = decimal
  const current = +balance.amount / Math.pow(10, decimal)

  // validate balance
  if (current < payload.amount && !payload.all) {
    throw new InsufficientBalanceError({
      msgOrInteraction: ci,
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

  validateTipAmount({
    msgOrInteraction: ci,
    amount: payload.amount,
    decimal,
    ...(opts.entries && { numOfRecipients: opts.entries }),
  })

  // validate tip range
  const usdAmount = payload.amount * balance.token?.price
  await isInTipRange(ci, usdAmount)

  // proceed to transfer
  payload.chain_id = balance.token?.chain?.chain_id
  payload.amount_string = formatDigit({
    value: payload.amount.toString(),
    fractionDigits: decimal,
    withoutCommas: true,
  })
  payload.token_price = balance.token?.price
  return showConfirmation(payload, opts)
}

function composeAirdropButtons() {
  return new MessageActionRow().addComponents(
    new MessageButton({
      customId: `confirm_airdrop`,
      emoji: getEmoji("CHECK"),
      style: "SUCCESS",
      label: "Confirm",
    }),
    new MessageButton({
      customId: `cancel_airdrop`,
      emoji: getEmoji("REVOKE"),
      style: "DANGER",
      label: "Cancel",
    }),
  )
}

async function selectToken(
  ci: CommandInteraction,
  payload: TransferPayload,
  balances: any,
  opts: AirdropOptions,
) {
  const options = balances.map((b: any) => {
    return {
      label: `${b.token.name} (${b.token?.chain?.name ?? b.token?.chain_id})`,
      value: b.token.chain.chain_id,
    }
  })
  // select menu
  const selectRow = composeDiscordSelectionRow({
    customId: `airdrop-select-token`,
    placeholder: "Select a token",
    options,
  })

  const chains = balances
    .map((b: any) => {
      return `\`${b.token?.chain?.name}\``
    })
    .filter((s: any) => Boolean(s))
    .join(", ")
  // embed
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: ci.user,
    author: ["Multiple results found", getEmojiURL(emojis.MAG)],
    description: `You have \`${payload.token}\` balance on multiple chains: ${chains}.\nPlease select one of the following`,
  })

  // reply
  await reply(ci, {
    messageOptions: { embeds: [embed], components: [selectRow] },
    selectMenuCollector: {
      handler: tokenSelectionHandler(ci, payload, balances, opts),
    },
  })
}

export const describeRunTime = (duration = 0) => {
  const hours = Math.floor(duration / 3600)
  const mins = Math.floor((duration - hours * 3600) / 60)
  const secs = duration % 60
  let str = ""
  hours
  if (hours) {
    str += `${hours}h`
  } else if (mins) {
    str += `${mins}m`
  } else if (secs) {
    str += `${secs}s`
  }

  return str
}

function showConfirmation(
  payload: TransferPayload,
  opts: AirdropOptions,
): RunResult<MessageOptions> {
  const tokenEmoji = getEmojiToken(payload.token as TokenEmojiKey)
  const usdAmount = payload.amount * (payload.token_price ?? 0)
  const formattedUsd = roundFloatNumber(usdAmount, 4)
  const formattedAmount = formatDigit({
    value: payload.amount.toString(),
    fractionDigits: 18,
  })
  const amountDescription = `${tokenEmoji} **${formattedAmount} ${payload.token}** (${APPROX} $${formattedUsd})`

  const confirmEmbed = composeEmbedMessage(null, {
    title: `${getEmoji("AIRDROP")} Confirm airdrop`,
    description: `Are you sure you want to spend ${amountDescription} on this airdrop?`,
    color: msgColors.BLUE,
  }).addFields([
    {
      name: `${getEmoji("CLOCK")} Run time`,
      value: `${describeRunTime(opts.duration)}`,
      inline: true,
    },
    {
      name: `${getEmoji("FLAG")} Max entries`,
      value: `${opts.entries ?? "-"}`,
      inline: true,
    },
    {
      name: `${getEmoji("QRCODE")} Use QR code`,
      value: opts.useQR ? "Yes" : "No",
      inline: true,
    },
  ])

  return {
    messageOptions: {
      embeds: [confirmEmbed],
      components: [composeAirdropButtons()],
    },
    buttonCollector: {
      handler: confirmationHandler(payload, opts),
    },
  }
}

export async function getAirdropArgs(i: CommandInteraction) {
  const amountArg = i.options.getString("amount", true)
  const unit = i.options.getString("token", true)
  let durationArg = i.options.getString("duration") ?? "3m"
  const entries = i.options.getInteger("entries")
  const useQR = i.options.getBoolean("use_qr", false) ?? false

  if (useQR && entries === null) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Entries",
      description:
        "Airdrop that uses a QR code must specify for how many people.",
    })
  }

  // get amount
  const { amount: parsedAmount, all } = parseTipAmount(i, amountArg)
  // check if unit is a valid token ...
  const isToken = await isTokenSupported(unit)
  let moniker
  // if not then it could be a moniker
  if (!isToken) {
    moniker = await parseMoniker(unit, i.guildId ?? "")
  }
  const amount = parsedAmount * (moniker?.moniker?.amount ?? 1)
  const token = (moniker?.moniker?.token?.token_symbol ?? unit).toUpperCase()

  // if unit is not either a token or a moniker -> reject
  if (!moniker && !isToken) {
    throw new UnsupportedTokenError({ msgOrInteraction: i, symbol: token })
  }

  // get optional arguments (duration & max entries)
  // if duration doesn't have unit, use minute as default
  durationArg = isNaN(+durationArg) ? durationArg : `${durationArg}m`
  let duration = parse(durationArg)
  duration = duration ? duration / 1000 : 3600

  // duration max = 1h
  if (duration && duration > 3600) {
    duration = 3600
  }

  // duration cannot be < 5s
  if (duration < 5) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Invalid duration",
      description:
        "The duration must be in form of second (s), minute (m) or hours (h) and from 5s to 1h.",
    })
  }

  if (typeof entries === "number" && !Number.isInteger(entries)) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Invalid entries",
      description:
        "The max entries can't be a decimal. Please insert a integer greater or equal to 1.",
    })
  }

  return { amount, token, duration, entries, all, useQR }
}
