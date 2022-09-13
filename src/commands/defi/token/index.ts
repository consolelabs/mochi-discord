import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import add from "./add"
import remove from "./remove"
import list from "./list"
import addcustom from "./addCustom"
import compare from "./compare"
import setDefault from "./default"
import { thumbnails } from "utils/common"

const actions: Record<string, Command> = {
  list,
  add,
  remove,
  "add-custom": addcustom,
  compare,
  default: setDefault,
}

const command: Command = {
  id: "tokens",
  command: "tokens",
  brief: "Show all supported tokens by Mochi",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        usage: `${PREFIX}tokens`,
        examples: `${PREFIX}tokens list\n${PREFIX}token list`,
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: false,
  aliases: ["token"],
  actions,
  colorType: "Defi",
}

export default command
