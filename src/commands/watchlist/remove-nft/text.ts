import { Command } from "types/common"
import { defaultEmojis, thumbnails } from "utils/common"
import { getSuccessEmbed, composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "cache/node-cache"
import { handleUpdateWlError } from "../processor"

const command: Command = {
  id: "watchlist_nft_remove",
  command: "remove-nft",
  brief: "Remove a NFT from your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbol = getCommandArguments(msg)[2]
    const userId = msg.author.id
    const { ok, error } = await defi.removeNFTFromWatchlist({
      userId,
      symbol,
    })
    if (!ok) handleUpdateWlError(msg, symbol, error, true)
    CacheManager.findAndRemove("watchlist", `watchlist-nft-${userId}`)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Successfully remove!",
            description: `**${symbol}** has been removed from your watchlist successfully!\n${defaultEmojis.POINT_RIGHT} You can add the new one by \`$watchlist add-nft <symbol>\`!`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Remove a NFT from your watchlist.",
        usage: `${PREFIX}watchlist remove-nft <symbol>`,
        examples: `${PREFIX}watchlist remove-nft neko`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
