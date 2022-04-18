import { Command } from "types/common"
import {
  Message,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { PREFIX } from "utils/constants"
import Profile from "modules/profile"
import {
  DirectMessageNotAllowedError,
  BotBaseError,
  UserNotVerifiedError,
} from "errors"
import { composeEmbedMessage } from "utils/discord-embed"

async function reverify(msg: Message) {
  try {
    const json = await Profile.generateVerification(
      msg.author.id,
      msg.guildId,
      true
    )

    switch (json.error) {
      case "unverified user":
        throw new UserNotVerifiedError({
          message: msg,
          discordId: msg.author.id,
        })
      case undefined: {
        // send
        const verifyMsg = new MessageEmbed()
          .setTitle("Let's update your identity")
          .setDescription("Click the button to verify your address")
          .setFooter("The link is valid for 10 minutes")

        const connectMetamask = new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Connect to Metamask")
            .setStyle("LINK")
            .setURL(`https://pod.so/verify?code=${json.code}`)
        )

        // send
        await msg.author.send({
          embeds: [verifyMsg],
          components: [connectMetamask],
        })
        break
      }
      default:
        throw new BotBaseError(msg)
    }
  } catch (e: any) {
    if (msg.channel.type !== "DM" && e.httpStatus === 403) {
      throw new DirectMessageNotAllowedError({ message: msg })
    }
    throw e
  }
}

const command: Command = {
  id: "reverify",
  command: "reverify",
  category: "Profile",
  name: "Reverify",
  run: reverify,
  getHelpMessage: async function (msg) {
    const embedMsg = composeEmbedMessage(msg, {
      description: `\`\`\`In case you need to re-verify with a different address.\`\`\``,
    }).addField("_Examples_", `\`${PREFIX}reverify\``, true)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  experimental: true,
}

export default command
