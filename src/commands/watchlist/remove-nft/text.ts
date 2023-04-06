import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import { removeWatchlistNftCollection } from "./processor"

const command: Command = {
  id: "watchlist_nft_remove",
  command: "remove-nft",
  brief: "Remove a NFT from your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbol = getCommandArguments(msg)[2]
    const userId = msg.author.id
    return await removeWatchlistNftCollection({
      msgOrInteraction: msg,
      userId,
      symbol,
    })
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
  allowDM: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
