import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { getSuccessEmbed, composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"
import CacheManager from "utils/CacheManager"
import { handleUpdateWlError } from "../watchlist_slash"

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
            description: `${symbol} has been removed from your watchlist successfully!`,
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
        usage: `${PREFIX}watchlist nft-remove <symbol>`,
        examples: `${PREFIX}watchlist nft-remove neko`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
