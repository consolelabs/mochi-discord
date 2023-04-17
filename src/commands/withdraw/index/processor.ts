import { CommandInteraction, Message } from "discord.js"
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
  getEmojiURL,
  isAddress,
  isValidAmount,
  msgColors,
} from "utils/common"
import {
  MOCHI_ACTION_WITHDRAW,
  MOCHI_APP_SERVICE,
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
} from "utils/constants"
import { validateBalance } from "utils/defi"
import { awaitMessage, isMessage } from "utils/discord"
import mochiPay from "../../../adapters/mochi-pay"
import { getProfileIdByDiscord } from "../../../utils/profile"
import * as processor from "./processor"

export async function getRecipient(
  msg: Message | CommandInteraction,
  dm: Message,
  symbol: string
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
  const isSolanaWithdrawal = symbol === "SOL"
  const { valid, type } = isAddress(address)
  const validAddress =
    valid && (isSolanaWithdrawal ? type === "sol" : type === "eth")
  if (first && !validAddress) {
    await first.reply({
      embeds: [
        getErrorEmbed({
          title: `Invalid ${symbol} address`,
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
  tokenArg: string
) {
  const payload = await getWithdrawPayload(
    msgOrInteraction,
    amountArg,
    tokenArg
  )
  const author = getAuthor(msgOrInteraction)
  const { message, interaction } = isMessage(msgOrInteraction)
  // send dm
  const dm = await author.send({
    embeds: [
      composeEmbedMessage(null, {
        author: ["Withdraw", getEmojiURL(emojis.ANIMATED_WITHDRAW)],
        thumbnail: getEmojiURL(emojis.ANIMATED_WITHDRAW),
        description: `**Withdrawal amount**\n${getEmoji(
          payload.token?.toUpperCase() ?? ""
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
  payload.address = await processor.getRecipient(
    msgOrInteraction,
    dm,
    payload.token
  )
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
  kafkaMsg.activity.content.amount = amountArg
  kafkaMsg.activity.content.token = tokenArg
  sendActivityMsg(kafkaMsg)

  const embed = composeWithdrawEmbed(payload)
  await author.send({ embeds: [embed] }).catch(() => {
    msgOrInteraction.reply({
      embeds: [enableDMMessage()],
    })
  })
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
    // {
    //   name: "Transaction ID",
    //   value: `[${payload.tx_hash}](${payload.tx_url})`,
    //   inline: false,
    // }
  )
}

export async function getWithdrawPayload(
  msgOrInteraction: Message | CommandInteraction,
  amountArg: string,
  token: string
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
  const all = equalIgnoreCase(amountArg, "all")
  // validate balance
  const { balance } = await validateBalance({ msgOrInteraction, token, amount })
  if (all) amount = balance

  return {
    address: "",
    profileId,
    amount: amount.toString(),
    token: token.toUpperCase(),
  }
}
