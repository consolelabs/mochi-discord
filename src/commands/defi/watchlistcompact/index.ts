import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import view from "./view"

const command: Command = {
  id: "watchlistcompact",
  command: "watchlistcompact",
  brief: "Show list of your favorite tokens",
  category: "Defi",
  run: async (msg) => {
    return await view.run(msg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Show list of your favorite tokens",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}watchlistcompact`,
        examples: `${PREFIX}watchlistcompact\n${PREFIX}wlc`,
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  aliases: ["wlc"],
}

export default command
