import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { viewWatchlist } from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { PREFIX } from "utils/constants"

const command: Command = {
  id: "watchlist_add",
  command: "add",
  brief: "Add token(s0) to your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbols = getCommandArguments(msg)
      .slice(2)
      .map((s) => s.trim())
      .filter((s) => !!s)
    return await viewWatchlist({ msg, symbols, userId: msg.author.id })
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Add token(s) to your watchlist.",
        usage: `${PREFIX}wl add <symbol1 symbol2 ...>`,
        examples: `${PREFIX}wl add eth\n${PREFIX}wl add ftm btc/sol matic`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
