import { Command } from "types/common"
import { Message, MessageEmbed } from "discord.js"
import { PREFIX, PROFILE_THUMBNAIL, SOCIAL_COLOR } from "env"
import {
  getEmbedFooter,
  getEmoji,
  getHeader,
  getHelpEmbed,
} from "utils/discord"
import Social from "modules/social"

async function withdraw(msg: Message, args: string[]) {
  const payload = await Social.getWithdrawPayload(msg, args)
  const data = await Social.discordWalletWithdraw(JSON.stringify(payload))
  const ftmEmoji = getEmoji("ftm")
  const tokenEmoji = getEmoji(payload.cryptocurrency)
  const embedMsg = new MessageEmbed()
    .setThumbnail(PROFILE_THUMBNAIL)
    .setColor(SOCIAL_COLOR)
    .setAuthor("Withdraw")
    .setTitle(`${tokenEmoji} ${payload.cryptocurrency.toUpperCase()} sent`)
    .setDescription("Your withdrawal was processed succesfully!")
    .addField("Destination address", `\`${payload.toAddress}\``, false)
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
    .setFooter(getEmbedFooter([msg.author.tag]), msg.author.avatarURL())
    .setTimestamp()

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
    const args = msg.content.replace(/  +/g, " ").trim().split(" ")
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
  getHelpMessage: async () => {
    let description =
      ":arrow_heading_up: **Withdrawal - help**\n\n**Send coins to an address.**"
    description +=
      "\nInstant withdrawal wizard. You will be asked for the address and the amount you want to withdraw."
    description +=
      "\nA network fee will be added on top of your withdrawal (or deducted if you can't afford it). You will be asked to confirm it."
    description += `\n\nTo withdraw use \`${PREFIX}withdraw <address> <amount> <token>\`, for example \`${PREFIX}withdraw 0x0000000000000000000000000000000000000000 5 ftm\`.`
    const embedMsg = getHelpEmbed("Withdraw").setDescription(description)
    embedMsg
      .setAuthor("")
      .setFooter(`Use ${PREFIX}tokens for a list of supported tokens`)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["widthraw", "witdraw", "wd"],
}

export default command
