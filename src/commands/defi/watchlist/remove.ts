import { Command } from "types/common"
import { thumbnails } from "utils/common"
import {
  getErrorEmbed,
  getSuccessEmbed,
  composeEmbedMessage,
} from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "watchlist_remove",
  command: "remove",
  brief: "Remove a token from your watchlist.",
  category: "Defi",
  run: async (msg) => {
    const symbol = getCommandArguments(msg)[2]
    const { ok } = await defi.removeFromWatchlist({
      userId: msg.author.id,
      symbol,
    })
    if (!ok) return { messageOptions: { embeds: [getErrorEmbed({})] } }
    return {
      messageOptions: { embeds: [getSuccessEmbed({})] },
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
