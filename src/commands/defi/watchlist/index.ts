import { Command } from "types/common"
import { getEmoji, thumbnails } from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX, WATCHLIST_GITBOOK } from "utils/constants"
import view from "./view"
import add from "./add"
import remove from "./remove"
import addNFT from "./add-nft"
import removeNFT from "./remove-nft"

const actions: Record<string, Command> = {
  view,
  add,
  "add-nft": addNFT,
  remove,
  "remove-nft": removeNFT,
}

const command: Command = {
  id: "watchlist",
  command: "watchlist",
  brief: "Watchlist",
  category: "Defi",
  run: async () => null,
  featured: {
    title: `${getEmoji("search")} Watchlist`,
    description: "Manage your watchlist for selected tokens",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your watchlist",
        description: "Manage your watchlist for selected tokens/nfts",
        usage: `${PREFIX}watchlist <action>`,
        examples: `${PREFIX}wl view\n${PREFIX}watchlist add eth\n${PREFIX}watchlist add-nft neko`,
        document: WATCHLIST_GITBOOK,
        footer: [
          `Type ${PREFIX}help watchlist <action> for a specific action!.`,
        ],
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: false,
  colorType: "Defi",
  minArguments: 2,
  actions,
  aliases: ["wl"],
}

export default command
