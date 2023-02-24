import Defi from "adapters/defi"
import { commands } from "commands"
import { CommandInteraction, Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { OffchainTipBotWithdrawRequest } from "types/defi"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { getCommandObject } from "utils/commands"
import { getEmoji, isAddress } from "utils/common"
import { askForUserInput } from "utils/discord"

export async function getDestinationAddress(
  msg: Message | CommandInteraction,
  dm: Message,
  symbol: string
): Promise<string> {
  const author = msg instanceof Message ? msg.author : msg.user
  const userReply = await askForUserInput(author.id, dm.channel)
  const address = userReply?.content.trim() ?? ""
  const { valid, type } = isAddress(address)
  const isSolana = symbol === "SOL"
  const validAddress = valid && (isSolana ? type === "sol" : type === "eth")
  if (userReply && !validAddress) {
    await userReply.reply({
      embeds: [
        getErrorEmbed({
          title: "Invalid destination address",
          description: `Please re-enter a valid ${
            isSolana ? "**Solana**" : "**EVM**"
          } wallet address below...`,
        }),
      ],
    })
    return await getDestinationAddress(msg, dm, symbol)
  }
  return userReply?.content?.trim() ?? ""
}

export async function withdraw(msg: Message, args: string[]) {
  const payload = await getWithdrawPayload(msg, args[1], args[2], args[3])
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
          description: `**${payload.token.toUpperCase()}** hasn't been supported.\n${getEmoji(
            "POINTINGRIGHT"
          )} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${getEmoji(
            "POINTINGRIGHT"
          )} To add your token, run \`$token add\`.`,
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
  const payload = await getWithdrawPayload(i, amount, token, addr)
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

async function getWithdrawPayload(
  msg: Message | CommandInteraction,
  amountArg: string,
  token: string,
  toAddress: string
): Promise<OffchainTipBotWithdrawRequest> {
  let type
  let sender
  if (msg instanceof Message) {
    const commandObject = getCommandObject(commands, msg)
    type = commandObject?.command
    sender = msg.author.id
  } else {
    type = msg.commandName
    sender = msg.user.id
  }
  const guildId = msg.guildId ?? "DM"

  const recipients = [toAddress]
  const cryptocurrency = token.toUpperCase()

  // check if recipient is valid or not
  if (!recipients || !recipients.length) {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msg,
      error: "No valid recipient found!",
    })
  }

  // validate tip amount, just allow: number (1, 2, 3.4, 5.6) or string("all")
  const amount = parseFloat(amountArg.toLowerCase())
  if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
    throw new DiscordWalletTransferError({
      discordId: sender,
      message: msg,
      error: "The amount is invalid. Please insert a natural number.",
    })
  }

  return {
    recipient: sender,
    recipientAddress: toAddress,
    guildId,
    channelId: msg.channelId,
    amount,
    token: cryptocurrency,
    each: false,
    all: amountArg === "all",
    transferType: type ?? "",
    duration: 0,
    fullCommand:
      msg instanceof Message
        ? msg.content
        : `${msg.commandName} ${amountArg} ${token} ${toAddress}`,
  }
}
