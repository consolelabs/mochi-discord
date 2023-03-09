import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleNftStats } from "./processor"

const command: Command = {
  id: "nft_stats",
  command: "stats",
  brief: "show total collections added",
  category: "Community",
  run: async function (msg) {
    await handleNftStats(msg)
    return null
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft stats`,
        examples: `${PREFIX}nft stats`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 2,
}

export default command
