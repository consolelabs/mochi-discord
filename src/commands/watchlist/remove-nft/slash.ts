import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import { removeWatchlistNftCollection } from "./processor"

const command: SlashCommand = {
  name: "remove-nft",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove-nft")
      .setDescription("Remove a NFT from your watchlist.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription(
            "The NFT which you wanna remove from your watchlist. Example: Neko"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("symbol", true)
    const userId = interaction.user.id
    return await removeWatchlistNftCollection({
      msgOrInteraction: interaction,
      userId,
      symbol,
    })
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Remove a NFT from your watchlist.",
        usage: `${PREFIX}watchlist remove-nft <symbol>`,
        examples: `${PREFIX}watchlist remove neko`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
