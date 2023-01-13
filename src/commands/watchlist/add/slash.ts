import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { composeEmbedMessage2 } from "discord/embed/ui"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX, SPACES_REGEX } from "utils/constants"
import { viewWatchlist } from "./processor"

const command: SlashCommand = {
  name: "add",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Add token(s) to your watchlist.")
      .addStringOption((option) =>
        option
          .setName("symbols")
          .setDescription(
            "The tickers/pairs space-separated list you wanna add to your watchlist. Example: ftm eth"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const opt = interaction.options.getString("symbols", true)
    const symbols = opt
      .split(SPACES_REGEX)
      .map((s) => s.trim())
      .filter((s) => !!s)
    const userId = interaction.user.id
    return await viewWatchlist({ interaction, symbols, userId })
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Add token(s) to your watchlist.",
        usage: `${PREFIX}watchlist add <symbol1 symbol2 ...>`,
        examples: `${PREFIX}watchlist add eth\n${PREFIX}watchlist add ftm btc/sol matic`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
