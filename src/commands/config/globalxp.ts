import config from "adapters/config"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getExitButton,
} from "utils/discordEmbed"

export async function confirmGlobalXP(
  interaction: ButtonInteraction,
  msg: Message
) {
  await interaction.deferUpdate()
  const [authorId, currentGlobalXP] = interaction.customId.split("-").slice(1)
  if (authorId !== interaction.user.id) {
    return
  }
  const globalXP = !JSON.parse(currentGlobalXP) // toggle config

  await config.toggleGuildGlobalXP(interaction.guildId, globalXP)
  await msg.edit({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Configure successfully",
        description: `Global XP is now ${
          globalXP ? "enabled" : "disabled"
        } for server **${interaction.guild.name}**`,
      }),
    ],
    components: [],
  })
}

const command: Command = {
  id: "globalxp",
  command: "globalxp",
  brief: "Toggle global XP for this server",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const guild = await config.getGuild(msg.guildId)
    if (!guild) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg })],
        },
      }
    }

    const components = new MessageActionRow().addComponents(
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
            author: [`${msg.guild.name}'s global XP`, msg.guild.iconURL()],
            description: `Global XP is currently ${
              guild.global_xp ? "enabled" : "disabled"
            } for this server.\n Do you want to **${
              guild.global_xp ? "disable" : "enable"
            }**?`,
          }),
        ],
        components: [components],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}globalxp`,
        examples: `${PREFIX}globalxp`,
      }),
    ],
  }),
  canRunWithoutAction: true,
}

export default command
