import { Command } from "types/common"
import { Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX } from "utils/constants"
import {
  defaultEmojis,
  getCommandArguments,
  getEmoji,
  getHeader,
} from "utils/common"
import Defi from "adapter/defi"
import { composeEmbedMessage } from "utils/discord-embed"

async function withdraw(msg: Message, args: string[]) {
  const payload = await Defi.getTransferPayload(msg, args)
  const data = await Defi.discordWalletWithdraw(JSON.stringify(payload))
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

  return {
    embeds: [embedMsg],
  }
}

const command: Command = {
  id: "withdraw",
  command: "withdraw",
  name: "withdraw",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length < 4) {
      const helpMessage = await this.getHelpMessage(msg)
      msg.channel.send(helpMessage)
      return
    }

    const embeds = await withdraw(msg, args)
    return {
      messageOptions: {
        ...embeds,
        content: getHeader("Here is your withdrawal receipt!", msg.author),
      },
    }
  },
  getHelpMessage: async (msg) => {
    let description = `${defaultEmojis.ARROW_UP} **Withdrawal - help**\n\n**Send coins to an address.**`
    description +=
      "\nInstant withdrawal wizard. You will be asked for the address and the amount you want to withdraw."
    description +=
      "\nA network fee will be added on top of your withdrawal (or deducted if you can't afford it). You will be asked to confirm it."
    description += `\n\nTo withdraw use \`${PREFIX}withdraw <address> <amount> <token>\`, for example \`${PREFIX}withdraw 0x0000000000000000000000000000000000000000 5 ftm\`.`
    const embedMsg = composeEmbedMessage(msg, {
      description,
      footer: [DEFI_DEFAULT_FOOTER],
    })
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["widthraw", "witdraw", "wd"],
}

export default command
