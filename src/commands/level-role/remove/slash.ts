import config from "adapters/config"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getSuccessEmbed,
} from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"

const command: SlashCommand = {
  name: "remove",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a level-role configuration")
      .addStringOption((option) =>
        option
          .setName("level")
          .setDescription(
            "level which you want to remove configuration role. Example: 1"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId || !interaction.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }

    const args = interaction.options.getString("level", true)
    const level = +args
    if (Number.isNaN(level) || level <= 0 || level >= Infinity) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ description: "Invalid level argument" })],
        },
      }
    }

    await config.removeGuildLevelRoleConfig(interaction.guildId, level)

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            description: `Level-role configuration removed for lv${level} successfully`,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Remove a level-role configuration",
        usage: `${SLASH_PREFIX}levelrole remove <level>`,
        examples: `${SLASH_PREFIX}levelrole remove 6`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
