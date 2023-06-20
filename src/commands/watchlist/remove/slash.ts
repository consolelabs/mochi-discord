import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX, SPACES_REGEX } from "utils/constants"
import { removeWatchlistToken } from "./processor"

const command: SlashCommand = {
  name: "remove",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove token(s) to your watchlist.")
      .addStringOption((option) =>
        option
          .setName("symbols")
          .setDescription(
            "The token which you wanna remove from your watchlist. Example: FTM ETH/USDT BTC/SOL"
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
    return await removeWatchlistToken({
      symbols,
      userId,
      msgOrInteraction: interaction,
    })
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
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
