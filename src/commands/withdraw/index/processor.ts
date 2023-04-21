import { CommandInteraction, Message, SelectMenuInteraction } from "discord.js"
import { APIError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { KafkaQueueActivityDataCommand } from "types/common"
import { composeButtonLink } from "ui/discord/button"
import {
  composeEmbedMessage,
  enableDMMessage,
  getErrorEmbed,
} from "ui/discord/embed"
import { defaultActivityMsg, sendActivityMsg } from "utils/activity"
import {
  emojis,
  equalIgnoreCase,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  isAddress,
  isValidAmount,
  msgColors,
  TokenEmojiKey,
} from "utils/common"
import {
  MOCHI_ACTION_WITHDRAW,
  MOCHI_APP_SERVICE,
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
} from "utils/constants"
import { awaitMessage, isMessage, reply } from "utils/discord"
import mochiPay from "../../../adapters/mochi-pay"
import { getProfileIdByDiscord } from "../../../utils/profile"
import * as processor from "./processor"
import { composeDiscordSelectionRow } from "../../../ui/discord/select-menu"
import { convertString } from "../../../utils/convert"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { isTokenSupported } from "../../../utils/tip-bot"
import { formatDigit, isNaturalNumber } from "../../../utils/defi"

export async function getRecipient(
  msg: Message | CommandInteraction,
  dm: Message,
  payload: any
): Promise<string> {
  const author = msg instanceof Message ? msg.author : msg.user
  const timeoutEmbed = getErrorEmbed({
    title: "Withdrawal cancelled",
    description:
      "No input received. You can retry transaction with `$withdraw <amount> <token>`",
  })
  const { first, content: address } = await awaitMessage({
    authorId: author.id,
    msg: dm,
    timeoutResponse: { embeds: [timeoutEmbed] },
  })
  const isSolanaWithdrawal = payload.chainId === "999"
  const { valid, type } = isAddress(address)
  const validAddress =
    valid && (isSolanaWithdrawal ? type === "sol" : type === "eth")
  if (first && !validAddress) {
    await first.reply({
      embeds: [
        getErrorEmbed({
          title: `Invalid ${payload.token} address`,
          description: `Please retry with \`$withdraw\` and enter a valid **${
            isSolanaWithdrawal ? "Solana" : "EVM"
          } wallet address**.`,
        }),
      ],
    })
    return ""
  }
  return address
}

export async function withdraw(
  msgOrInteraction: Message | CommandInteraction,
  amountArg: string,
  tokenArg: TokenEmojiKey
) {
  const author = getAuthor(msgOrInteraction)
  const profileId = await getProfileIdByDiscord(author.id)

  const validAmount = isValidAmount({ arg: amountArg, exceptions: ["all"] })
  if (!validAmount) {
    throw new DiscordWalletTransferError({
      discordId: author.id,
      message: msgOrInteraction,
      error: "The amount is invalid. Please insert a natural number.",
    })
  }
  let amount = parseFloat(amountArg)

  // validate token
  const isToken = await isTokenSupported(tokenArg)
  if (!isToken) {
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    const errorEmbed = getErrorEmbed({
      title: "Unsupported token",
      description: `**${tokenArg}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
    reply(msgOrInteraction, { messageOptions: { embeds: [errorEmbed] } })
    return null
  }

  // validate balance
  const { data, ok, curl, log } = await mochiPay.getBalances({
    profileId: profileId,
    token: tokenArg,
  })
  if (!ok) {
    throw new APIError({ curl, description: log, msgOrInteraction })
  }

  const balances = data.filter((b: any) => b.amount !== "0")

  // no balance -> reject
  if (!balances.length) {
    throw new InsufficientBalanceError({
      msgOrInteraction,
      params: { current: 0, required: amount, symbol: tokenArg },
    })
  }

  const payload: any = {
    address: "",
    profileId,
    amount: amount.toString(),
    token: tokenArg.toUpperCase(),
    chainId: "",
  }

  const all = equalIgnoreCase(amountArg, "all")

  // one matching token -> proceed to send tip
  if (balances.length === 1) {
    const balance = balances[0]
    const decimal = balance?.token?.decimal ?? 0
    const current = convertString(balance?.amount, decimal) ?? 0
    if (all) amount = current
    payload.amount = amount.toString()
    if (current < amount) {
      throw new InsufficientBalanceError({
        msgOrInteraction,
        params: { current, required: amount, symbol: tokenArg },
      })
    }
    if (!isNaturalNumber(payload.amount * Math.pow(10, decimal))) {
      throw new DiscordWalletTransferError({
        message: msgOrInteraction,
        error: ` ${payload.token} valid amount must not have more than ${decimal} fractional digits. Please try again!`,
      })
    }
    payload.amount_string = formatDigit(amount.toString(), decimal)
    payload.chainId = balance.token?.chain?.chain_id
    await executeWithdraw(msgOrInteraction, payload)
    return
  }

  await selectTokenToWithdraw(msgOrInteraction, balances, payload, all)
}

function composeWithdrawEmbed(payload: any) {
  const token = payload.token?.toUpperCase() ?? ""
  const tokenEmoji = getEmoji(token)
  return composeEmbedMessage(null, {
    author: ["Withdraw Order Submitted", getEmojiURL(emojis.CHECK)],
    description: "Your withdrawal was processed succesfully!",
    color: msgColors.MOCHI,
  }).addFields(
    {
      name: `Recipient's ${token} Address`,
      value: `\`\`\`${payload.address}\`\`\``,
      inline: false,
    },
    {
      name: "Recipient amount",
      value: `${tokenEmoji} ${payload.amount} ${token}`,
      inline: true,
    }
  )
}

async function selectTokenToWithdraw(
  msgOrInteraction: Message | CommandInteraction,
  balances: any,
  payload: any,
  all: boolean
) {
  const author = getAuthor(msgOrInteraction)
  // select menu
  const selectRow = composeDiscordSelectionRow({
    customId: `withdraw-select-token`,
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
    payload.chainId = i.values[0]
    const balance = balances.find(
      (b: any) =>
        equalIgnoreCase(b.token?.symbol, payload.token) &&
        payload.chainId === b.token?.chain?.chain_id
    )
    const decimal = balance?.token?.decimal ?? 0
    const current = convertString(balance?.amount, decimal) ?? 0
    if (all) payload.amount = current
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
    payload.amount = payload.amount.toString()
    payload.amount_string = formatDigit(payload.amount.toString(), decimal)
    await executeWithdraw(msgOrInteraction, payload)
  }

  // reply
  reply(msgOrInteraction, {
    messageOptions: { embeds: [embed], components: [selectRow] },
    selectMenuCollector: { handler: suggestionHandler },
  })
}

export async function executeWithdraw(
  msgOrInteraction: Message | CommandInteraction,
  payload: any
) {
  const { message, interaction } = isMessage(msgOrInteraction)
  const author = getAuthor(msgOrInteraction)
  // send dm
  const dm = await author.send({
    embeds: [
      composeEmbedMessage(null, {
        author: ["Withdraw", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
        thumbnail: getEmojiURL(emojis.ANIMATED_WITHDRAW),
        description: `**Withdrawal amount**\n${getEmojiToken(
          (payload.token?.toUpperCase() as TokenEmojiKey) ?? ""
        )} ${payload.amount} ${payload.token}\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} Please enter your **${
          payload.token
        }** destination address that you want to withdraw your tokens below.`,
        color: msgColors.MOCHI,
      }),
    ],
  })

  // redirect to dm if not in DM
  if (msgOrInteraction.guildId) {
    const replyPayload = {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Withdraw tokens", getEmojiURL(emojis.WALLET)],
          description: `${author}, a withdrawal message has been sent to you. Check your DM!`,
        }),
      ],
      components: [composeButtonLink("See the DM", dm.url)],
    }
    message ? message.reply(replyPayload) : interaction.editReply(replyPayload)
  }
  // ask for recipient address
  payload.address = await processor.getRecipient(msgOrInteraction, dm, payload)
  if (!payload.address) return
  // withdraw
  const { ok, error, log, curl } = await mochiPay.withdraw(payload)
  if (!ok) {
    throw new APIError({ msgOrInteraction, curl, description: log, error })
  }

  const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
    payload.profileId,
    MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
    MOCHI_APP_SERVICE,
    MOCHI_ACTION_WITHDRAW
  )
  kafkaMsg.activity.content.amount = payload.amount
  kafkaMsg.activity.content.token = payload.token
  sendActivityMsg(kafkaMsg)

  const embed = composeWithdrawEmbed(payload)
  await author.send({ embeds: [embed] }).catch(() => {
    msgOrInteraction.reply({
      embeds: [enableDMMessage()],
    })
  })
}
