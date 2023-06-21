import config from "adapters/config"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { emojis, getEmojiURL, msgColors } from "utils/common"
import { APIError } from "errors"
import { list } from "./processor"

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

    if (!res.ok) {
      throw new APIError({
        msgOrInteraction: interaction,
        curl: res.curl,
        description: res.log,
      })
    }

    const { title, description } = await list(res)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(interaction, {
            author: [title, getEmojiURL(emojis.ANIMATED_BADGE_2)],
            description,
            color: msgColors.PINK,
          }),
        ],
      },
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        title: "Get server's level role configuration",
        usage: `${SLASH_PREFIX}role level list`,
        examples: `${SLASH_PREFIX}role level set list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
