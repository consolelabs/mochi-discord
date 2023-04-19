import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { Message, CommandInteraction } from "discord.js"
import { getSuccessEmbed } from "ui/discord/embed"
import { handleUpdateWlError } from "../processor"

export const removeWatchlistToken = async ({
  msgOrInteraction,
  userId,
  symbols,
}: {
  msgOrInteraction: Message | CommandInteraction
  userId: string
  symbols: string[]
}) => {
  for (const symbol of symbols) {
    const { ok, error } = await defi.removeFromWatchlist({
      userId,
      symbol,
    })
    if (!ok) handleUpdateWlError(msgOrInteraction, symbol, error, true)
    CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
  }
  return { messageOptions: { embeds: [getSuccessEmbed({})] } }
}
