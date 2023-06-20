import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX, SPACES_REGEX } from "utils/constants"
import { addWatchlistToken } from "./processor"

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
            "The space-separated list you wanna add to your watchlist. Example: FTM ETH/USDT BTC/SOL"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const opt = interaction.options.getString("symbols", true)
    const symbols = opt
      .split(SPACES_REGEX)
      .map((s) => s.trim())
      .filter(Boolean)
    const userId = interaction.user.id
    return await addWatchlistToken({
      interaction,
      symbols,
      originSymbols: symbols,
      userId,
    })
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Add token(s) to your watchlist.",
        usage: `${PREFIX}watchlist add <symbol1 symbol2 ...>`,
        examples: `${PREFIX}watchlist add eth\n${PREFIX}watchlist add FTM BTC/SOL MATIC`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
