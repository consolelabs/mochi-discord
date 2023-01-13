import config from "adapters/config"
import { Message, MessageActionRow, MessageButton } from "discord.js"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getExitButton,
} from "ui/discord/embed"

const run = async function (msg: Message) {
  if (!msg.guildId || !msg.guild) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            description: "This command must be run in a Guild",
          }),
        ],
      },
    }
  }
  const guild = await config.getGuild(msg.guildId)
  if (!guild) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ msg })],
      },
    }
  }

  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `globalxp_confirm-${msg.author.id}-${guild.global_xp}`,
      style: guild.global_xp ? "DANGER" : "PRIMARY",
      label: guild.global_xp ? "Disable" : "Enable",
    }),
    getExitButton(msg.author.id)
  )

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          author: [`${msg.guild.name}'s global XP`, msg.guild.iconURL() ?? ""],
          description: `Global XP is currently ${
            guild.global_xp ? "enabled" : "disabled"
          } for this server.\n Do you want to **${
            guild.global_xp ? "disable" : "enable"
          }**?`,
        }),
      ],
      components: [actionRow],
    },
  }
}
export default run
