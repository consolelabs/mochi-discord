import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { handlePoeTwitterStats } from "commands/config/poe/twitter/stats"

const command: SlashCommand = {
  name: "stats",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("stats")
      .setDescription("View twitter leaderboard")
      .addIntegerOption((option) =>
        option
          .setName("page")
          .setDescription("page index. Example: 1")
          .setMinValue(1)
          .setRequired(false)
      )
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }
    const page = interaction.options.getInteger("page") ?? 1 // default first page
    return await handlePoeTwitterStats(
      interaction,
      interaction.guildId,
      page - 1
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}poe twitter stats <page>`,
        examples: `${SLASH_PREFIX}poe twitter stats 1`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
