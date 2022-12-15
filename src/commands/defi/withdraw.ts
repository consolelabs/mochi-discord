import { Command } from "types/common"
import { CommandInteraction, Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, DEPOSIT_GITBOOK, PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import Defi from "adapters/defi"
import { composeButtonLink, composeEmbedMessage } from "utils/discordEmbed"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import { APIError, CommandArgumentError, InternalError } from "errors"
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

async function withdraw(msg: Message, args: string[]) {
  if (args.length < 4) {
    throw new CommandArgumentError({
      message: msg,
      getHelpMessage: () => command.getHelpMessage(msg),
    })
  }
  const payload = await Defi.getWithdrawPayload(msg, args[1], args[2], args[3])
  const { data, ok, error, log, curl } = await Defi.offchainDiscordWithdraw(
    payload
  )
  if (!ok) {
    switch (error) {
      case "Token not supported":
        throw new InternalError({
          message: msg,
          title: "Unsupported token",
          description: `${payload.token} hasn't been supported.\n👉 Please choose one in our supported \`$token list\` or \`$moniker list\`!\n👉 To add your token, run \`$token add-custom\` or \`$token add\`.`,
        })
      case "Not enough balance":
        throw new InternalError({
          message: msg,
          title: "Transaction error",
          description: `<@${msg.author.id}>, your balance is insufficient.`,
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

const command: Command = {
  id: "withdraw",
  command: "withdraw",
  brief: `Token withdrawal`,
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const dm = await msg.author.send({
      embeds: [
        composeEmbedMessage(msg, {
          author: ["Withdraw message", getEmojiURL(emojis.WALLET)],
          description: `Please enter your **${args[2].toUpperCase()}** destination address that you want to withdraw your tokens below.`,
        }),
      ],
    })

    if (msg.guild !== null) {
      msg.reply({
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Withdraw tokens", getEmojiURL(emojis.WALLET)],
            description: `${msg.author}, a withdrawal message has been sent to you. Check your DM!`,
          }),
        ],
        components: [composeButtonLink("See the DM", dm.url)],
      })
    }
    args[3] = await getDestinationAddress(msg, dm)
    await withdraw(msg, args)

    return null
  },
  featured: {
    title: `${getEmoji("right_arrow")} Withdraw`,
    description: "Withdraw tokens to your wallet outside of Discord",
  },
  getHelpMessage: async (msg) => {
    const embedMsg = composeEmbedMessage(msg, {
      description:
        "Withdraw tokens to your wallet outside of Discord. A network fee will be added on top of your withdrawal (or deducted if remaining balance is insufficient).\nYou will be asked to confirm it.",
      usage: `${PREFIX}withdraw <amount> <token>`,
      examples: `${PREFIX}withdraw 5 ftm`,
      document: DEPOSIT_GITBOOK,
      footer: [DEFI_DEFAULT_FOOTER],
    })
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  aliases: ["wd"],
  colorType: "Defi",
  allowDM: true,
  minArguments: 3,
}

export default command
