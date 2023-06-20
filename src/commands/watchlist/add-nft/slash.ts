import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import * as processor from "./processor"

const command: SlashCommand = {
  name: "add-nft",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add-nft")
      .setDescription("Add a NFT to your watchlist.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription(
            "The NFT which you wanna add to your watchlist. Example: Neko"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const symbol = interaction.options.getString("symbol", true)
    const userId = interaction.user.id
    return await processor.addWatchlistNftCollection({
      msgOrInteraction: interaction,
      symbol,
      userId,
    })
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Add a NFT to your watchlist.",
        usage: `${PREFIX}watchlist add-nft <symbol>`,
        examples: `${PREFIX}watchlist add-nft neko`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
