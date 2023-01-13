import { SelectMenuInteraction } from "discord.js"
import { getSuccessEmbed } from "ui/discord/embed"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { InteractionHandler } from "handlers/discord/select-menu"
import { handleUpdateWlError } from "../processor"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const value = interaction.values[0]
  const [symbol, address, chain, userId] = value.split("_")
  const { ok, error } = await defi.addNFTToWatchlist({
    user_id: userId,
    collection_symbol: symbol,
    collection_address: address,
    chain,
  })
  if (!ok) handleUpdateWlError(msgOrInteraction, symbol, error)
  CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: "Successfully set!",
          description: `${symbol} has been added successfully! To see your watchlist use \`$wl view\``,
        }),
      ],
      components: [],
    },
  }
}
