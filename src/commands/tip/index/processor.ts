import { utils as mochiUtils } from "@consolelabs/mochi-formatter"
import { userMention } from "@discordjs/builders"
import {
  CommandInteraction,
  Message,
  MessageOptions,
  SelectMenuInteraction,
  TextChannel,
  MessageButton,
  MessageActionRow,
  User,
  MessageMentions,
  ButtonInteraction,
  TextInputComponent,
  ModalActionRowComponent,
  Modal,
} from "discord.js"
import mochiPay from "adapters/mochi-pay"
import { GuildIdNotFoundError, InternalError, OriginalMessage } from "errors"
import { APIError } from "errors/api"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  composeInsufficientBalanceEmbed,
  getErrorEmbed,
} from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  TokenEmojiKey,
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  shortenHashOrAddress,
} from "utils/common"
import { getChannelUrl, isMessage, reply } from "utils/discord"
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
import defi from "adapters/defi"
import config from "adapters/config"
import { UnsupportedTokenError } from "errors/unsupported-token"
import { RunResult } from "types/common"
import { TransferPayload } from "types/transfer"
import { composeDiscordSelectionRow } from "ui/discord/select-menu"
import { APPROX } from "utils/constants"
import {
  getProfileIdByDiscord,
  getDiscordRenderableByProfileId,
} from "utils/profile"
import NodeCache from "node-cache"
import { convertString } from "utils/convert"
import { ethers } from "ethers"

const contentCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 3600,
  useClones: false,
})

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

  const guildName = msgOrInteraction.guild?.name ?? ""
  const guildAvatar = msgOrInteraction.guild?.iconURL()
  const channel_url = await getChannelUrl(msgOrInteraction)

  const payload: TransferPayload = {
    sender: author.id,
    targets: [...new Set(targets)],
    recipients: [...new Set(recipients)],
    guild_id: msgOrInteraction.guildId ?? "",
    channel_id: msgOrInteraction.channelId,
    channel_name: `${guildName}`,
    channel_url,
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
    channel_avatar: guildAvatar,
  }

  if (moniker !== undefined) {
    payload.moniker = moniker.moniker.moniker
    payload.chain_id = moniker.moniker?.token?.chain?.chain_id
  }

  // only one matching token -> proceed to send tip
  // if tip with moniker -> no need to select token
  if (balances.length === 1 || moniker !== undefined) {
    const balance = balances[0]
    payload.token_id = balance.token_id
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
    const selectedTokenId = i.values[0]
    const balance = balances.find((b: any) => selectedTokenId === b.token_id)
    payload.chain_id = balance?.token?.chain?.chain_id
    payload.token_id = selectedTokenId
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
  const options = balances.map((b: any) => ({
    label: `${b.token?.chain?.name ?? b.token?.chain_id} | ${b.token.name}${
      b.token.address ? ` | ${shortenHashOrAddress(b.token.address)}` : ""
    }`,
    value: b.token_id,
  }))
  // select menu
  const selectRow = composeDiscordSelectionRow({
    customId: `tip-select-token`,
    placeholder: "Select a token",
    options,
  })

  // embed
  const embed = composeEmbedMessage(null, {
    originalMsgAuthor: author,
    author: ["Multiple results found", getEmojiURL(emojis.MAG)],
    description: `You have multiple \`${balances[0].token?.symbol}\` balances.\nPlease select one of the following`,
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
    recipients: await Promise.all(
      payload.recipients.map((r: string) => getProfileIdByDiscord(r)),
    ),
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
  payload.message = rawMessage // need assign back to show @user in discord response
  const hashtagTemplate = await handleMessageHashtag(payload.message)
  const interactionId = msgOrInteraction.id
  return showSuccesfulResponse(
    interactionId,
    payload,
    data,
    senderStr,
    hashtagTemplate,
  )
}

function showSuccesfulResponse(
  interactionId: string,
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

  const key = `follow-tip_${interactionId}`
  contentCache.set(key, {
    payload: payload,
    res: res,
    amountApprox: amountApprox,
  })

  const followTipButton = new MessageActionRow().addComponents(
    new MessageButton({
      customId: key,
      label: "Join the tip",
      style: "SECONDARY",
    }),
  )

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
        components: [followTipButton],
      },
    }
  }

  return {
    messageOptions: {
      content: `${content}${contentMsg}`,
      components: [followTipButton],
      embeds: [],
    },
  }
}

//
export async function handleFollowTip(i: ButtonInteraction) {
  await i.deferUpdate()
  const followTipCache = contentCache.get<any>(i.customId)
  if (!followTipCache) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Unexpected error occur!",
      descriptions: [
        "The follow tip failed. Please try again later. If the problem persists, please contact us on Discord.",
      ],
    })
  }
  const payload = followTipCache.payload
  const amountEach = payload.amount / payload.recipients.length

  // exclude the tip's follower from recipients
  payload.targets = payload.targets.filter(
    (t: string) => t !== i.user.toString(),
  )
  payload.recipients = payload.recipients.filter((r: string) => r !== i.user.id)

  // if no valid recipients -> show error
  if (!payload.recipients.length) {
    const errEmbed = getErrorEmbed({
      title: "Failed to join the tip",
      description: "No valid recipients found!",
    })
    await i
      .followUp({
        embeds: [errEmbed],
        ephemeral: true,
      })
      .catch(() => null)
    return
  }

  // re-calculate amount with filtered recipients
  const newAmount = amountEach * payload.recipients.length

  const res = followTipCache.res
  const amountApprox = followTipCache.amountApprox

  const displayNames = (await i.guild?.members.fetch())
    ?.filter((member: any) => payload.recipients.includes(member?.user?.id))
    ?.map((r: any) => r.displayName)

  const embed = composeEmbedMessage(null, {
    title: `New tip to ${displayNames?.join(", ")}`,
    description: `
      \`Amount.    \` ${getEmojiToken(
        payload.token,
      )} ${mochiUtils.formatTokenDigit(
        newAmount,
      )} **${payload.token.toUpperCase()}** ${amountApprox}
      \`Receiver.  \` ${payload.targets.join(", ")}
      \`Message.   \` ${payload.message || "Send money"}
    `,
    color: "#89fa8e",
  })

  const composeFollowTipButton = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `confirm-follow-tip-${i.message.id}-${res.external_id}`,
      label: "Confirm",
      style: "SECONDARY",
    }),
    new MessageButton({
      customId: `custom-follow-tip-${i.message.id}-${res.external_id}`,
      label: "Custom",
      style: "SECONDARY",
    }),
  )

  await i
    .followUp({
      embeds: [embed],
      components: [composeFollowTipButton],
      ephemeral: true,
    })
    .catch(() => null)
  return
}

export async function handleConfirmFollowTip(i: ButtonInteraction) {
  const args = i.customId.split("-")
  const followTxId = args[4]

  const {
    data: followTx,
    ok,
    curl,
    status = 500,
    error,
  } = await mochiPay.getTxByExternalId(followTxId)
  if (!ok) {
    throw new APIError({
      msgOrInteraction: i,
      description: "Cannot get transaction",
      curl,
      status,
      error,
    })
  }

  const author = getAuthor(i)
  const balances = await getBalances({
    msgOrInteraction: i,
    token: followTx.token.symbol,
  })
  if (!balances.length) {
    await i.reply({
      embeds: [
        composeInsufficientBalanceEmbed({
          current: 0,
          required: followTx.metadata.original_amount,
          symbol: followTx.token.symbol,
          author,
        }),
      ],
    })
  }

  const channel_url = await getChannelUrl(i as any)
  const guildAvatar = i.guild?.iconURL()
  const senderPid = await getProfileIdByDiscord(i.user.id)
  const recipients = followTx.other_profiles
    ?.map((p: { id: string }) => p.id)
    .filter((id: string) => id != senderPid)
  const guildID = i.channel instanceof TextChannel ? i.channel.guildId : ""
  const guildName = i.guild?.name ?? ""
  const amountBN = ethers.BigNumber.from(followTx.amount)
  const decimalBN = ethers.BigNumber.from(followTx.token?.decimal)
  const amountStr = ethers.utils.formatUnits(amountBN, decimalBN)

  const payload = {
    sender: senderPid,
    recipients,
    guild_id: guildID,
    channel_id: i.channel?.id,
    channel_name: guildName,
    channel_url: channel_url,
    amount: parseFloat(amountStr),
    token: followTx.token.symbol,
    token_id: followTx.token.id,
    transfer_type: followTx.action,
    message: followTx.metadata?.message || "Send money",
    chain_id: followTx.token.chain_id,
    platform: "discord",
    original_amount: followTx.metadata.original_amount,
    channel_avatar: guildAvatar,
    original_tx_id: followTxId,
    each: followTx.other_profiles?.length > 1,
  }

  const {
    data: dataTransfer,
    ok: okTransfer,
    curl: curlTransfer,
    log: logTransfer,
    status: statusTransfer = 500,
    error: errorTransfer,
  } = await defi.transferV2({ ...payload })
  if (!okTransfer) {
    if (errorTransfer.includes("Not enough balance")) {
      const tokenBalance = balances[0] ?? { amount: "0" }
      const { amount: balanceAmount = "0" } = tokenBalance
      const balance = convertString(balanceAmount, tokenBalance?.token?.decimal)
      await i.reply({
        embeds: [
          composeInsufficientBalanceEmbed({
            current: balance,
            required: followTx.metadata.original_amount,
            symbol: followTx.token.symbol,
            author,
          }),
        ],
      })
      return
    }
    throw new APIError({
      msgOrInteraction: i,
      description: logTransfer,
      curl: curlTransfer,
      error: errorTransfer,
      status: statusTransfer,
    })
  }

  const discordRecipients = await Promise.all(
    payload.recipients.map((r: string) => getDiscordRenderableByProfileId(r)),
  )

  const recipientsString = discordRecipients.join(", ")

  const amountUsd = mochiUtils.formatUsdDigit(
    +dataTransfer?.amount_each * followTx.token.price,
  )

  let content = `<@${i.user.id}> sent ${recipientsString} ${getEmojiToken(
    payload.token,
  )} **${mochiUtils.formatTokenDigit(payload.amount)}** **${payload.token}** (${
    amountUsd.startsWith("<") ? "" : APPROX
  } ${amountUsd})${
    payload.recipients.length > 1 ? " each" : ""
  }! ${mochiUtils.string.receiptLink(dataTransfer?.external_id ?? "")}`
  if (payload.message) {
    content += `\nwith a message: ${payload.message}`
  }
  await i.reply({
    content,
    components: [],
    embeds: [],
  })
}

export async function handleCustomFollowTip(i: ButtonInteraction) {
  const args = i.customId.split("-")
  const followTxId = args[4]

  const modal = new Modal().setCustomId("amount-form").setTitle("New tip")

  const valueInput = new TextInputComponent()
    .setCustomId("custom_value")
    .setLabel("Value")
    .setRequired(true)
    .setStyle("SHORT")

  const tokenInput = new TextInputComponent()
    .setCustomId("custom_token")
    .setLabel("Token")
    .setRequired(true)
    .setStyle("SHORT")

  const msgInput = new TextInputComponent()
    .setCustomId("custom_message")
    .setLabel("Message")
    .setRequired(false)
    .setStyle("SHORT")

  const valueAction =
    new MessageActionRow<ModalActionRowComponent>().addComponents(valueInput)
  const tokenAction =
    new MessageActionRow<ModalActionRowComponent>().addComponents(tokenInput)
  const messageAction =
    new MessageActionRow<ModalActionRowComponent>().addComponents(msgInput)

  modal.addComponents(valueAction, tokenAction, messageAction)

  await i.showModal(modal)

  const submitted = await i
    .awaitModalSubmit({
      time: 300000,
      filter: (mi) => mi.user.id === i.user.id,
    })
    .catch(() => null)

  if (!submitted) return { msgOpts: i.message }

  if (!submitted.deferred) {
    await submitted.deferUpdate().catch(() => null)
  }
  const amount = submitted.fields.getTextInputValue("custom_value")
  const token = submitted.fields.getTextInputValue("custom_token")
  const message = submitted.fields.getTextInputValue("custom_message")

  const {
    data: followTx,
    ok,
    curl,
    status = 500,
    error,
  } = await mochiPay.getTxByExternalId(followTxId)
  if (!ok) {
    throw new APIError({
      msgOrInteraction: i,
      description: "Cannot get transaction",
      curl,
      status,
      error,
    })
  }

  const author = getAuthor(i)
  const balances = await getBalances({ msgOrInteraction: i, token: token })
  if (!balances.length) {
    await i.followUp({
      embeds: [
        composeInsufficientBalanceEmbed({
          current: 0,
          required: followTx.metadata.original_amount,
          symbol: token as TokenEmojiKey,
          author,
        }),
      ],
    })
    return
  }

  // when have multiple token, temp do like this until clarify logic
  const choosenToken = identifyToken(balances)

  const channel_url = await getChannelUrl(i as any)
  const guildAvatar = i.guild?.iconURL()
  const recipients = [followTx.other_profile_id]
  const guildID = i.channel instanceof TextChannel ? i.channel.guildId : ""
  const guildName = i.guild?.name ?? ""
  const payload = {
    sender: i.user.id,
    recipients: recipients,
    guild_id: guildID,
    channel_id: i.channel?.id,
    channel_name: guildName,
    channel_url: channel_url,
    amount: +amount,
    token: token,
    // token_id: choosenToken.id,
    transfer_type: followTx.action,
    message: message,
    chain_id: choosenToken.chain_id,
    platform: "discord",
    original_amount: +amount,
    channel_avatar: guildAvatar,
    original_tx_id: followTxId,
  }

  const {
    data: dataTransfer,
    ok: okTransfer,
    curl: curlTransfer,
    log: logTransfer,
    status: statusTransfer = 500,
    error: errorTransfer,
  } = await defi.transferV2({
    ...payload,
    sender: await getProfileIdByDiscord(payload.sender),
  })
  if (!okTransfer) {
    if (statusTransfer === 400) {
      await i.followUp({
        embeds: [
          composeInsufficientBalanceEmbed({
            current: 0,
            required: followTx.metadata.original_amount,
            symbol: followTx.token.symbol,
            author,
          }),
        ],
      })
    } else {
      throw new APIError({
        msgOrInteraction: i,
        description: logTransfer,
        curl: curlTransfer,
        status: statusTransfer,
        error: errorTransfer,
      })
    }
  }
  const recipientDiscord = await getDiscordRenderableByProfileId(
    followTx.other_profile_id,
  )

  const amountUsd = mochiUtils.formatUsdDigit(
    +dataTransfer?.amount_each * choosenToken.price,
  )
  if (amountUsd) {
    await i.followUp({
      content: `<@${i.user.id}> sent ${recipientDiscord} ${getEmojiToken(
        payload.token as TokenEmojiKey,
      )} **${mochiUtils.formatTokenDigit(
        payload.amount,
      )}** **${payload.token.toUpperCase()}** (${
        amountUsd.startsWith("<") ? "" : APPROX
      } ${amountUsd})! ${mochiUtils.string.receiptLink(
        dataTransfer?.external_id,
      )}`,
      components: [],
      embeds: [],
    })
  } else {
    await i.followUp({
      content: `<@${i.user.id}> sent ${recipientDiscord} ${getEmojiToken(
        payload.token as TokenEmojiKey,
      )} **${mochiUtils.formatTokenDigit(
        payload.amount,
      )}** **${payload.token.toUpperCase()}**! ${mochiUtils.string.receiptLink(
        dataTransfer?.external_id,
      )}`,
      components: [],
      embeds: [],
    })
  }
}

function identifyToken(bals: any) {
  for (const bal of bals) {
    if (bal.token?.native) {
      return bal.token
    }
  }

  return bals[0].token
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
  const totalAmount =
    payload.amount * (payload.each ? payload.recipients.length : 1)
  if (current < totalAmount && !payload.all) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: {
        current,
        required: totalAmount,
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
  payload.amount_string = mochiUtils.formatTokenDigit(payload.amount.toString())
  payload.token_price = balance.token?.price
  return transfer(msgOrInteraction, payload)
}
