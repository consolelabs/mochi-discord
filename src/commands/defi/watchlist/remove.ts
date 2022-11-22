import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { getSuccessEmbed, composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "../watchlist_slash"
import { allowedFiats } from "../ticker/compare"
import { isValidFiatPair } from "utils/defi"

const command: Command = {
  id: "watchlist_remove",
  command: "remove",
  brief: "Remove a token from your watchlist.",
  category: "Defi",
  run: async (msg) => {
    let symbol = getCommandArguments(msg)[2]
    const symbols = symbol.split("/")

    // fiat case: gbpusd, vnd
    if (symbols.length === 1) {
      if (allowedFiats.includes(symbols[0].toLowerCase())) {
        symbol += "/usd"
      }

      // fiat symbols are 3 letters long
      if (symbol.length === 6) {
        const b = symbol.slice(0, 3)
        const t = symbol.slice(3, 6)
        if (isValidFiatPair([b, t])) {
          symbol = symbol.replace(symbols[0], b + "/" + t)
        }
      }
    }

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
            title: "Successfully remove!",
            description: `Token has been deleted successfully!`,
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
