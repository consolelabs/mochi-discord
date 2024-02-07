import { userMention } from "@discordjs/builders"
import { utils as mochiUtils } from "@consolelabs/mochi-formatter"
import {
  CommandInteraction,
  Message,
  MessageOptions,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  TokenEmojiKey,
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmojiToken,
  getEmojiURL,
} from "utils/common"
import { getChannelUrl, isMessage, reply } from "utils/discord"
import config from "adapters/config"
import defi from "adapters/defi"
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
import { APPROX } from "utils/constants"

async function getRecipients(
  msgOrInteraction: Message | CommandInteraction,
  targets: string[],
) {
  // check if recipient is valid or not
  const recipients: string[] = []
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

    recipients.push(recipientPf.id)
  }
  return recipients
}

export async function execute(
  msgOrInteraction: Message | CommandInteraction,
  payload: any,
) {
  // send transfer request
  const {
    data,
    ok,
    curl,
    log,
    status = 500,
    error,
  } = await defi.transferV2({
    ...payload,
    sender: await getProfileIdByDiscord(payload.sender),
    recipients: payload.recipients,
  })
  if (!ok) {
    throw new APIError({
      msgOrInteraction,
      curl,
      description: log,
      status,
      error,
    })
  }

  const member = await msgOrInteraction.guild?.members.fetch(payload.sender)
  const senderStr =
    member?.nickname || member?.displayName || member?.user.username
  // respond with successful message
  const hashtagTemplate = await handleMessageHashtag(payload.message)
  const interactionId = msgOrInteraction.id
  return showSuccesfulResponse(interactionId, payload, data, hashtagTemplate)
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

  const {
    targets,
    recipients,
    amount,
    symbol,
    each,
    all,
    message,
    image,
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

  const guildName = msgOrInteraction.guild?.name ?? ""
  const guildAvatar = msgOrInteraction.guild?.iconURL()
  const channel_url = await getChannelUrl(msgOrInteraction)

  const payload = {
    sender: author.id,
    targets,
    recipients,
    guild_id: msgOrInteraction.guildId ?? "",
    channel_id: msgOrInteraction.channelId,
    channel_name: `${guildName}`,
    channel_url,
    amount: amount,
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
    channel_avatar: guildAvatar,
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
    return await validateAndTransfer(msgOrInteraction, payload, balance)
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
  targets: string[]
  recipients: string[]
  amount: number
  symbol: string
  message: string
  image: string
  each: boolean
  all: boolean
  originalAmount: number
}> {
  const targets = args[1].split(",")
  // get array of recipients' profile ID
  const recipients = await getRecipients(msgOrInteraction, targets)

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

  return {
    targets,
    recipients,
    amount,
    symbol,
    each,
    message,
    all,
    image,
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

function showSuccesfulResponse(
  interactionId: string,
  payload: any,
  res: any,
  hashtagTemplate?: any,
): RunResult<MessageOptions> {
  const recipientDescription = payload.targets.join(", ")

  const unitCurrency = payload.moniker ? payload.moniker : payload.token
  const amountToken = `${getEmojiToken(
    payload.token,
  )} ${mochiUtils.formatTokenDigit(res.amount_each.toString())} ${
    payload.token
  }`
  const amountApproxMoniker = payload.moniker ? `${amountToken} ` : ""
  const amount = payload.moniker
    ? payload.original_amount
    : `${mochiUtils.formatTokenDigit(res.amount_each.toString())}`
  const emojiAmountWithCurrency = payload.moniker
    ? ""
    : getEmojiToken(payload.token)
  let amountWithCurrency = `${emojiAmountWithCurrency} ${amount} ${unitCurrency}`
  amountWithCurrency = amountWithCurrency.trim()

  const amountUsd = mochiUtils.formatUsdDigit(
    res.amount_each * payload.token_price,
  )

  const amountApprox = `(${amountApproxMoniker}${
    amountUsd.startsWith("<") ? "" : APPROX
  } ${amountUsd})`

  let contentMsg = ``

  if (payload.message) {
    contentMsg += `\nwith a message: ${payload.message}`
  }

  const content = `${userMention(
    payload.sender,
  )} sent ${recipientDescription} **${amountWithCurrency}** ${amountApprox}${
    payload.recipients.length > 1 ? " each" : ""
  }! ${mochiUtils.string.receiptLink(res.external_id)}`

  if (hashtagTemplate) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: hashtagTemplate.product_hashtag.title,
            description: `${hashtagTemplate.product_hashtag.description.replace(
              "{.content}",
              content,
            )}${contentMsg}`,
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
    },
  }
}
