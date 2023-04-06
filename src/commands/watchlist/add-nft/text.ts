import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import * as processor from "./processor"

const command: Command = {
  id: "watchlist_nft_add",
  command: "add-nft",
  brief: "Add a NFT to your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbol = getCommandArguments(msg)[2]
    const userId = msg.author.id
    return await processor.addWatchlistNftCollection({
      msgOrInteraction: msg,
      userId,
      symbol,
    })
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Add a NFT to your watchlist.",
        usage: `${PREFIX}watchlist add-nft <symbol>`,
        examples: `${PREFIX}watchlist add-nft neko`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  allowDM: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
