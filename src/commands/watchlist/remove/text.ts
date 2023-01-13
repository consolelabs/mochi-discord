import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { getSuccessEmbed, composeEmbedMessage } from "discord/embed/ui"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "cache/node-cache"
import { parseTickerQuery } from "utils/defi"
import { handleUpdateWlError } from "../processor"

const command: Command = {
  id: "watchlist_remove",
  command: "remove",
  brief: "Remove a token from your watchlist.",
  category: "Defi",
  run: async (msg) => {
    let symbol = getCommandArguments(msg)[2]
    const { isFiat, base, target } = parseTickerQuery(symbol)
    if (isFiat) symbol = `${base}/${target}`

    const userId = msg.author.id
    const { ok, error } = await defi.removeFromWatchlist({
      userId,
      symbol,
    })
    if (!ok) handleUpdateWlError(msg, symbol, error, true)
    CacheManager.findAndRemove("watchlist", `watchlist-${userId}`)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Remove token successfully",
            description:
              "The token is deleted successfully! Add new one by `$wl add <symbol>`.",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Remove a token from your watchlist.",
        usage: `${PREFIX}watchlist remove <symbol>`,
        examples: `${PREFIX}watchlist remove eth`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
