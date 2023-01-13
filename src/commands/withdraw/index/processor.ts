import { CommandInteraction, Message } from "discord.js"
import Defi from "adapters/defi"
import { composeEmbedMessage } from "discord/embed/ui"
import { getEmoji } from "utils/common"
import { APIError, InternalError } from "errors"
import { OffchainTipBotWithdrawRequest } from "types/defi"

export async function getDestinationAddress(
  msg: Message | CommandInteraction,
  dm: Message
): Promise<string> {
  const authorId = msg instanceof Message ? msg.author.id : msg.user.id
  const filter = (collected: Message) => collected.author.id === authorId
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()
  // if (userReply && !userReply.content.trim().startsWith("0x")) {
  //   await userReply.reply({
  //     embeds: [
  //       getErrorEmbed({
  //         description: "Invalid input!\nPlease re-enter a valid address...",
  //       }),
  //     ],
  //   })
  //   return await getDestinationAddress(msg, dm)
  // }
  return userReply?.content?.trim() ?? ""
}

export async function withdraw(msg: Message, args: string[]) {
  const payload = await Defi.getWithdrawPayload(msg, args[1], args[2], args[3])
  // check balance
  const invalidBalEmbed = await Defi.getInsuffientBalanceEmbed(
    msg,
    payload.recipient,
    payload.token,
    payload.amount,
    payload.all ?? false
  )
  if (invalidBalEmbed) {
    return {
      embeds: [invalidBalEmbed],
    }
  }

  const { data, ok, error, log, curl } = await Defi.offchainDiscordWithdraw(
    payload
  )

  if (!ok) {
    switch (error) {
      case "Token not supported":
        throw new InternalError({
          message: msg,
          title: "Unsupported token",
          description: `**${payload.token.toUpperCase()}** hasn't been supported.\n👉 Please choose one in our supported \`$token list\` or \`$moniker list\`!\n👉 To add your token, run \`$token add-custom\` or \`$token add\`.`,
        })
      default:
        throw new APIError({ message: msg, curl, description: log, error })
    }
  }

  const embedMsg = composeWithdrawEmbed(payload, data)

  await msg.author.send({ embeds: [embedMsg] })
}

export function composeWithdrawEmbed(
  payload: OffchainTipBotWithdrawRequest,
  data: Record<string, any>
) {
  const tokenEmoji = getEmoji(payload.token)
  return composeEmbedMessage(null, {
    author: ["Withdraw"],
    title: `${tokenEmoji} ${payload.token.toUpperCase()} sent`,
    description: "Your withdrawal was processed succesfully!",
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

// slash
export async function withdrawSlash(
  i: CommandInteraction,
  amount: string,
  token: string,
  addr: string
) {
  const payload = await Defi.getWithdrawPayload(i, amount, token, addr)
  payload.fullCommand = `${i.commandName} ${amount} ${token}`
  const { data, ok, error, log, curl } = await Defi.offchainDiscordWithdraw(
    payload
  )
  if (!ok) {
    throw new APIError({ description: log, curl, error })
  }

  const embedMsg = composeWithdrawEmbed(payload, data)

  await i.user.send({ embeds: [embedMsg] })
}
