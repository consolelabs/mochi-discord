import { Command } from "types/common"
import { collectButton, composeTokenWatchlist } from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import { PREFIX } from "utils/constants"

const command: Command = {
  id: "watchlist_view",
  command: "view",
  brief: "View your watchlist",
  category: "Defi",
  run: async (msg) => {
    const { embeds, files, components } = await composeTokenWatchlist(
      msg,
      0,
      msg.author.id
    )
    const replyMsg = await msg.reply({
      embeds,
      components,
      files,
    })
    //collectPaginationButton(replyMsg, msg, msg.author.id)
    collectButton(replyMsg, msg, msg.author.id)
    return null
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Show list of your favorite tokens",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}watchlist view [page]`,
        examples: `${PREFIX}wl view`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  allowDM: true,
  colorType: "Defi",
}

export default command
