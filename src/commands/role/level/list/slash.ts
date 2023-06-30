import config from "adapters/config"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
} from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import {
  getRoleConfigDescription,
  renderLevelRole,
  View,
} from "commands/roles/index/processor"
import { emojis, getEmojiURL } from "utils/common"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Get server's levelroles configuration")
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
    const res = await config.getGuildLevelRoleConfigs(interaction.guildId)

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Level role", getEmojiURL(emojis.XP)],
            description: [
              getRoleConfigDescription(View.LevelRole),
              renderLevelRole(res.data),
            ].join("\n"),
            thumbnail: interaction.guild?.iconURL(),
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Get server's level role configuration",
        usage: `${SLASH_PREFIX}role level list`,
        examples: `${SLASH_PREFIX}role level set list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
