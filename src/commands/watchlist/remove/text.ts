import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import { parseTickerQuery } from "utils/defi"
import { removeWatchlistToken } from "./processor"

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
    return await removeWatchlistToken({
      userId,
      symbol,
      msgOrInteraction: msg,
    })
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
