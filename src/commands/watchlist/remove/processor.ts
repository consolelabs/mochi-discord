import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { Message, CommandInteraction } from "discord.js"
import { getSuccessEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { getEmoji } from "utils/common"
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
  const symbolString = (symbols: string[]) => {
    return symbols
      .map(function (s) {
        return s.toUpperCase()
      })
      .join(" ")
  }
  for (const symbol of symbols) {
    const { ok, error } = await defi.removeFromWatchlist({
      userId,
      symbol,
    })
    if (!ok) await handleUpdateWlError(msgOrInteraction, symbol, error, true)
    CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
  }
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: `${symbolString(symbols)} has been removed from the watchlist`,
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} View watchlist with ${await getSlashCommand("wlv")}.`,
        }),
      ],
    },
  }
}
