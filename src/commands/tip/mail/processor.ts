import { userMention } from "@discordjs/builders"
import mochiPay from "adapters/mochi-pay"
import {
  CommandInteraction,
  Message,
  MessageOptions,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { KafkaNotificationMessage, RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  TokenEmojiKey,
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiURL,
} from "utils/common"
import { MOCHI_ACTION_TIP } from "utils/constants"
import { convertToUsdValue } from "utils/convert"
import { isMessage, reply } from "utils/discord"
import { sendNotificationMsg } from "utils/kafka"
import {
  getBalances,
  isInTipRange,
  isTokenSupported,
  parseMessageTip,
  parseMoniker,
  parseTipAmount,
} from "utils/tip-bot"
import profile from "../../../adapters/profile"
import { DiscordWalletTransferError } from "../../../errors/discord-wallet-transfer"
import { InsufficientBalanceError } from "../../../errors/insufficient-balance"
import { UnsupportedTokenError } from "../../../errors/unsupported-token"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { formatDigit, isValidTipAmount } from "../../../utils/defi"
import { getProfileIdByDiscord } from "../../../utils/profile"
import { parseUnits } from "ethers/lib/utils"

type MailUser = {
  email: string
  profile_id: string
}

async function getRecipients(
  msgOrInteraction: Message | CommandInteraction,
  targets: string[],
): Promise<MailUser[]> {
  // check if recipient is valid or not
  const recipients: MailUser[] = []
  for (const target of targets) {
    const recipientPf = await profile.getByEmail(target)
    if (recipientPf.status_code === 404) {
      throw new InternalError({
        msgOrInteraction,
        title: "Username not found",
        description: `We couldn't find email \`${target}\`. Check the email you entered or try again.`,
      })
    }
    if (recipientPf.err) {
      throw new APIError({
        msgOrInteraction,
        description: `[getByEmail] failed with status ${recipientPf.status_code}: ${recipientPf.err}`,
        curl: "",
        status: recipientPf.status ?? 500,
        error: recipientPf.error,
      })
    }

    recipients.push({
      email: target,
      profile_id: recipientPf.id,
    })
  }
  return recipients
}

export async function execute(
  msgOrInteraction: Message | CommandInteraction,
  payload: any,
): Promise<RunResult<MessageOptions>> {
  // create pay link
  const res: any = await mochiPay.generatePaymentCode({
    profileId: payload.from.profile_global_id,
    amount: parseUnits(
      payload.originalAmount.toLocaleString().replaceAll(",", ""),
      payload.decimal,
    ).toString(),
    token_id: payload.token_id,
    token: payload.token,
    type: "paylink",
    note: payload.note,
    recipient_id: payload.tos[0].profile_global_id, // currently tip across platform have 1 recipient. If expand to tip many, need update api to receive list of recipients
  })

  console.log("Handle tip by email")
  if (!res.ok) {
    const { log: description, curl, status = 500, error } = res
    console.log("request fail, ", error)
    throw new APIError({ msgOrInteraction, description, curl, status, error })
  }

  // send msg to mochi-notification
  for (const recipient of payload.recipients) {
    const price = await convertToUsdValue(
      payload.originalAmount.toString(),
      payload.token,
    )
    const kafkaMsg: KafkaNotificationMessage = {
      id: payload.sender,
      platform: payload.from.platform,
      action: MOCHI_ACTION_TIP,
      note: payload.note,
      metadata: {
        amount: payload.originalAmount.toString(),
        token: payload.token,
        price: price,
        pay_link: `https://mochi.gg/pay/${res.data.code}`,
      },
      recipient_info: {
        mail: recipient.email,
      },
    }

    sendNotificationMsg(kafkaMsg)
  }

  const embed = composeEmbedMessage(null, {
    author: ["You've given a tip", getEmojiURL(emojis.CASH)],
    description: `Congrats! ${userMention(
      payload.sender,
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

export async function tipMail(
  msgOrInteraction: Message | CommandInteraction,
  args: string[],
) {
  if (!msgOrInteraction.guildId) {
    throw new GuildIdNotFoundError({ message: msgOrInteraction })
  }

  const author = getAuthor(msgOrInteraction)
  const onchain = equalIgnoreCase(args.at(-1), "--onchain")
  args = args.slice(0, onchain ? -1 : undefined) // remove --onchain if any

  const { recipients, amount, symbol, each, all, message } = await parseTipArgs(
    msgOrInteraction,
    args,
  )

  // get sender balances
  const balances = await getBalances({ msgOrInteraction, token: symbol })

  // no balance -> reject
  if (!balances.length) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: { current: 0, required: amount, symbol: symbol as TokenEmojiKey },
    })
  }

  const senderPfId = await getProfileIdByDiscord(author.id)

  const eachAmount = amount / (each ? 1 : recipients.length)

  const payload = {
    sender: author.id,
    recipients,
    from: {
      profile_global_id: `${senderPfId}`,
      platform: "discord",
    },
    tos: recipients.map((r) => ({
      profile_global_id: `${r.profile_id}`,
      platform: "email",
    })),
    amount: Array(recipients.length).fill(`${eachAmount}`),
    originalAmount: amount,
    token: symbol,
    all,
    note: message,
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

async function validateAndTransfer(
  msgOrInteraction: Message | CommandInteraction,
  payload: any,
  balance: any,
) {
  const decimal = balance.token?.decimal ?? 0
  const current = +balance.amount / Math.pow(10, decimal)

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
  payload.token_id = balance.token_id
  payload.amount_string = formatDigit({
    value: payload.amount.toString(),
    fractionDigits: decimal,
  })
  payload.token_price = balance.token?.price
  payload.decimal = decimal
  return await execute(msgOrInteraction, payload)
}

async function parseTipArgs(
  msgOrInteraction: Message | CommandInteraction,
  args: string[],
): Promise<{
  recipients: MailUser[]
  amount: number
  symbol: string
  message: string
  image: string
  each: boolean
  all: boolean
}> {
  // get array of recipients' profile ID
  const recipients = await getRecipients(msgOrInteraction, [args[1]])

  // amount: comes after targets
  const amountIdx = 2
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
  const each = args[eachIdx] === "each"

  // message comes after each, if no each then after unit
  const messageIdx = (each ? eachIdx : unitIdx) + 1
  const message = parseMessageTip(args, messageIdx)

  // image
  const { message: msg } = isMessage(msgOrInteraction)
  const image = msg ? msg.attachments.first()?.url ?? "" : ""

  return { recipients, amount, symbol, each, message, all, image }
}
