import defi from "adapters/defi"
import { CommandInteraction, Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { OffchainTipBotWithdrawRequest } from "types/defi"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
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
import { validateBalance } from "utils/defi"
import { awaitMessage } from "utils/discord"
import { tipTokenIsSupported } from "utils/tip-bot"
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
  const { token, amount, all } = payload
  const author = getAuthor(msgOrInteraction)
  // send dm
  const dm = await author.send({
    embeds: [
      composeEmbedMessage(null, {
        author: ["Withdraw message", getEmojiURL(emojis.WALLET)],
        description: `Please enter your **${token}** destination address that you want to withdraw your tokens below.`,
      }),
    ],
  })

  const tokenSupported = await tipTokenIsSupported(tokenArg)
  if (!tokenSupported) {
    const pointingright = getEmoji("pointingright")
    throw new InternalError({
      msgOrInteraction,
      title: "Unsupported token",
      description: `**${token}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
  }
  // check balance
  await validateBalance({ msgOrInteraction, token, amount, all })

  // redirect to dm if not in DM
  if (msgOrInteraction.guildId) {
    msgOrInteraction.reply({
      embeds: [
        composeEmbedMessage(null, {
          author: ["Withdraw tokens", getEmojiURL(emojis.WALLET)],
          description: `${author}, a withdrawal message has been sent to you. Check your DM!`,
        }),
      ],
      components: [composeButtonLink("See the DM", dm.url)],
    })
  }
  // ask for recipient address
  payload.recipientAddress = await processor.getRecipient(
    msgOrInteraction,
    dm,
    token
  )
  if (!payload.recipientAddress) return
  // withdraw
  const { data, ok, error, log, curl } = await defi.offchainDiscordWithdraw(
    payload
  )
  if (!ok)
    throw new APIError({ msgOrInteraction, curl, description: log, error })

  const embed = composeWithdrawEmbed(payload, data)
  await author.send({ embeds: [embed] })
}

function composeWithdrawEmbed(
  payload: OffchainTipBotWithdrawRequest,
  data: Record<string, any>
) {
  const tokenEmoji = getEmoji(payload.token)
  return composeEmbedMessage(null, {
    author: ["Withdraw"],
    title: `${tokenEmoji} ${payload.token.toUpperCase()} sent`,
    description: "Your withdrawal was processed succesfully!",
    color: msgColors.SUCCESS,
  }).addFields(
    {
      name: "Destination address",
      value: `\`${payload.recipientAddress}\``,
      inline: false,
    },
    {
      name: "Withdrawal amount",
      value: `**${data.amount}** ${tokenEmoji}`,
      inline: true,
    },
    {
      name: "Withdrawal Transaction ID",
      value: `[${data.tx_hash}](${data.tx_url})`,
      inline: false,
    }
  )
}

export async function getWithdrawPayload(
  msgOrInteraction: Message | CommandInteraction,
  amountArg: string,
  token: string
): Promise<OffchainTipBotWithdrawRequest> {
  const author = getAuthor(msgOrInteraction)
  const guildId = msgOrInteraction.guildId ?? "DM"

  const validAmount = isValidAmount({ arg: amountArg, exceptions: ["all"] })
  if (!validAmount) {
    throw new DiscordWalletTransferError({
      discordId: author.id,
      message: msgOrInteraction,
      error: "The amount is invalid. Please insert a natural number.",
    })
  }
  const fullCommand =
    msgOrInteraction instanceof Message
      ? msgOrInteraction.content
      : `${msgOrInteraction.commandName} ${amountArg} ${token}`

  return {
    recipient: author.id,
    recipientAddress: "",
    guildId,
    channelId: msgOrInteraction.channelId,
    amount: parseFloat(amountArg) || 0,
    token: token.toUpperCase(),
    each: false,
    all: equalIgnoreCase(amountArg, "all"),
    transferType: "withdraw",
    duration: 0,
    fullCommand,
  }
}
