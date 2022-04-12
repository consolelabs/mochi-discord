import { Command } from "commands"
import {
  Message,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { BOT_AVATAR, PREFIX } from "../env"
import {
  emojis,
  getHelpEmbed,
  getListCommands,
  onlyRunInBotChannel,
} from "../utils/discord"
import Profile from "modules/profile"
import { DirectMessageNotAllowedError, NekoBotBaseError } from "errors"

async function verify(msg: Message) {
  try {
    const json = await Profile.generateVerification(msg.author.id, msg.guildId)

    switch (json.error) {
      case "already have a pod identity":
        const replyMsg = new MessageEmbed()
          .setTitle("Meowww! You already had a pod identity")
          .setThumbnail(BOT_AVATAR)
          .setDescription(`${json.address}`)

        // send
        await msg.author.send({ embeds: [replyMsg] })
        break
      case undefined:
        // send
        const verifyMsg = new MessageEmbed()
          .setTitle("Meowww! Let's setup your Pod Identity")
          .setDescription("Click the button to verify your address")
          .setThumbnail(BOT_AVATAR)
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
      default:
        throw new NekoBotBaseError(msg)
    }
  } catch (e: any) {
    if (msg.channel.type !== "DM" && e.httpStatus === 403) {
      throw new DirectMessageNotAllowedError({ message: msg })
    }
    throw e
  }
}

const command: Command = {
  id: "verify",
  command: "verify",
  category: "Profile",
  name: "Verify",
  checkBeforeRun: onlyRunInBotChannel,
  run: verify,
  getHelpMessage: async function (msg) {
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    let embedMsg = getHelpEmbed("Verify Address")
      .setTitle(`${PREFIX}verify`)
      .addField("_Examples_", `\`${PREFIX}verify\``, true)
      .setDescription(
        `\`\`\`Verify your discord in Pod Town server to receive perks and use other features of the bot.\`\`\`\n${getListCommands(
          replyEmoji ?? "╰ ",
          {
            verify: {
              name: "Verify yourself, this is the same as `p!join`",
              command: "verify",
            },
          }
        )}\n\n_**Alias**_\n_${this.alias.map((a) => `\`${a}\``).join(", ")}_`
      )
    return { embeds: [embedMsg] }
  },
  alias: ["join"],
  canRunWithoutAction: true,
}

export default command
