import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import view from "./view"
import add from "./add"
import remove from "./remove"

const actions: Record<string, Command> = {
  view,
  add,
  remove,
}

const command: Command = {
  id: "watchlist",
  command: "watchlist",
  brief: "Manage your watchlist",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your watchlist",
        usage: `${PREFIX}watchlist <action>`,
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
