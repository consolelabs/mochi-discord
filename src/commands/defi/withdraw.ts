import { Command } from "types/common"
import { Message } from "discord.js"
// import { DEFI_DEFAULT_FOOTER, DEPOSIT_GITBOOK, PREFIX } from "utils/constants"
import { getEmoji } from "utils/common"
// import { getCommandArguments } from "utils/commands"
import Defi from "adapters/defi"
import {
  // composeButtonLink,
  composeEmbedMessage,
  getErrorEmbed,
  workInProgress,
} from "utils/discordEmbed"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function withdraw(msg: Message, args: string[]) {
  const payload = await Defi.getTransferPayload(msg, args)
  const json = await Defi.discordWalletWithdraw(JSON.stringify(payload), msg)
  const data = json.data
  const ftmEmoji = getEmoji("ftm")
  const tokenEmoji = getEmoji(payload.cryptocurrency)
  const embedMsg = composeEmbedMessage(msg, {
    author: ["Withdraw"],
    title: `${tokenEmoji} ${payload.cryptocurrency.toUpperCase()} sent`,
    description: "Your withdrawal was processed succesfully!",
  })
    .addField("Destination address", `\`${payload.recipients[0]}\``, false)
    .addField(
      "Withdrawal amount",
      `**${data.withdrawalAmount}** ${tokenEmoji}`,
      true
    )
    .addField("Transaction fee", `**${data.transactionFee}** ${ftmEmoji}`, true)
    .addField(
      "Withdrawal Transaction ID",
      `[${data.txHash}](${data.txURL})`,
      false
    )

  await msg.author.send({ embeds: [embedMsg] })
}

const command: Command = {
  id: "withdraw",
  command: "withdraw",
  brief: `Token withdrawal`,
  category: "Defi",
  run: async () => ({ messageOptions: await workInProgress() }),
  // run: async function (msg: Message) {
  //   return {
  //     messageOptions: {
  //       embeds: [
  //         com
  //       ],
  //     },
  //   }
  // const args = getCommandArguments(msg)
  // const dm = await msg.author.send(
  //   "Please enter your destination address here.\ne.g. 0xabcdde"
  // )
  // if (msg.guild != null) {
  //   msg.reply({
  //     embeds: [
  //       composeEmbedMessage(msg, {
  //         description: `:information_source: Info\n<@${msg.author.id}>, a withdrawal message has been sent to you via a DM`,
  //       }),
  //     ],
  //     components: [composeButtonLink("See the DM", dm.url)],
  //   })
  // }
  // args[3] = await getDestinationAddress(msg, dm)
  // await withdraw(msg, args)

  // return null
  // },
  featured: {
    title: `${getEmoji("right_arrow")} Withdraw`,
    description: "Withdraw tokens to your wallet outside of Discord",
  },
  getHelpMessage: workInProgress,
  // getHelpMessage: async (msg) => {
  //   const embedMsg = composeEmbedMessage(msg, {
  //     description:
  //       "Withdraw tokens to your wallet outside of Discord. A network fee will be added on top of your withdrawal (or deducted if remaining balance is insufficient).\nYou will be asked to confirm it.",
  //     usage: `${PREFIX}withdraw <amount> <token>`,
  //     examples: `${PREFIX}withdraw 5 ftm`,
  //     document: `${DEPOSIT_GITBOOK}&command=withdraw`,
  //     footer: [DEFI_DEFAULT_FOOTER],
  //   })
  //   return { embeds: [embedMsg] }
  // },
  canRunWithoutAction: true,
  aliases: ["wd"],
  colorType: "Defi",
  allowDM: true,
  minArguments: 3,
}

export default command
