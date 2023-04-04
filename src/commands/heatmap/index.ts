import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { emojis, getEmojiURL } from "../../utils/common"
import run from "./index/text"

const textCmd: Command = {
  id: "heatmap",
  command: "heatmap",
  brief: "Show top cryptocurrencies with live prices and 24h change in price",
  category: "Defi",
  run,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        author: ["Heatmap Crypto", getEmojiURL(emojis.MOCHI_CIRCLE)],
        usage: `${PREFIX}heatmap`,
      }),
    ],
  }),
  colorType: "Market",
  canRunWithoutAction: true,
  allowDM: true,
}

export default { textCmd }
