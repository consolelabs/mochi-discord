import { Command } from "types/common"
import { Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, DEPOSIT_GITBOOK, PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import Defi from "adapters/defi"
import {
  composeButtonLink,
  composeEmbedMessage,
  getErrorEmbed,
} from "utils/discordEmbed"
import { getEmoji, defaultEmojis } from "utils/common"

async function getDestinationAddress(
  msg: Message,
  dm: Message
): Promise<string> {
  const filter = (collected: Message) => collected.author.id === msg.author.id
  const collected = await dm.channel.awaitMessages({
    max: 1,
    filter,
  })
  const userReply = collected.first()
  if (userReply && !userReply.content.trim().startsWith("0x")) {
    await userReply.reply({
      embeds: [
        getErrorEmbed({
          msg,
          description: "Invalid input!\nPlease re-enter a valid address...",
        }),
      ],
    })
    return await getDestinationAddress(msg, dm)
  }
  return userReply?.content.trim() ?? ""
}

async function withdraw(msg: Message, args: string[]) {
  const payload = await Defi.getWithdrawPayload(msg, args)
  payload.fullCommand = msg.content
  const res = await Defi.offchainDiscordWithdraw(payload)
  if (!res.ok) {
    await msg.author.send({
      embeds: [getErrorEmbed({ msg, description: res.error })],
    })
    return
  }

  const ftmEmoji = getEmoji("ftm")
  const tokenEmoji = getEmoji(payload.token)
  const embedMsg = composeEmbedMessage(msg, {
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
      value: `**${res.data.withdraw_amount}** ${tokenEmoji}`,
      inline: true,
    },
    {
      name: "Transaction fee",
      value: `**${res.data.transaction_fee}** ${ftmEmoji}`,
      inline: true,
    },
    {
      name: "Withdrawal Transaction ID",
      value: `[${res.data.tx_hash}](${res.data.tx_url})`,
      inline: false,
    }
  )

  await msg.author.send({ embeds: [embedMsg] })
}

const command: Command = {
  id: "withdrawoff",
  command: "withdrawoff",
  brief: `Token withdrawal`,
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const dm = await msg.author.send({
      embeds: [
        composeEmbedMessage(msg, {
          title: `${
            defaultEmojis.GREY_QUESTION
          } Enter your **${args[2].toUpperCase()}** destination address.`,
          description: ``,
        }),
      ],
    })

    if (msg.guild !== null) {
      msg.reply({
        embeds: [
          composeEmbedMessage(msg, {
            description: `:information_source: Info\n<@${msg.author.id}>, a withdrawal message has been sent to you via a DM`,
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
  aliases: ["wdoff"],
  colorType: "Defi",
  allowDM: true,
  experimental: true,
  minArguments: 3,
}

export default command
