import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { getSuccessEmbed, composeEmbedMessage2 } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { handleUpdateWlError } from "../processor"

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
    const { ok, error } = await defi.removeNFTFromWatchlist({
      userId,
      symbol,
    })
    if (!ok) handleUpdateWlError(interaction, symbol, error, true)
    CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Successfully remove!",
            description: `${symbol} has been removed from your watchlist successfully!`,
          }),
        ],
      },
    }
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
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
