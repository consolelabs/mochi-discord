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
  if (authorId !== interaction.user.id || !interaction.guildId) {
    return
  }
  const globalXP = !JSON.parse(currentGlobalXP) // toggle config

  await config.updateGuild({
    guildId: interaction.guildId,
    globalXP: `${globalXP}`,
  })
  await msg.edit({
    embeds: [
      composeEmbedMessage(msg, {
        author: [
          `Global XP ${globalXP ? "enabled" : "disabled"}`,
          msg.guild?.iconURL() ?? "",
        ],
        description: `You can check your global XP with \`$profile\``,
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
            author: [
              `${msg.guild.name}'s global XP`,
              msg.guild.iconURL() ?? "",
            ],
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
  colorType: "Server",
}

export default command
