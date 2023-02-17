import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { removeWatchlistToken } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove a token from your watchlist.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription(
            "The token which you wanna remove from your watchlist. Example: FTM"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("symbol", true)
    const userId = interaction.user.id
    return await removeWatchlistToken({
      symbol,
      userId,
      msgOrInteraction: interaction,
    })
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Remove a token from your watchlist.",
        usage: `${PREFIX}watchlist remove <symbol>`,
        examples: `${PREFIX}watchlist remove eth`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
