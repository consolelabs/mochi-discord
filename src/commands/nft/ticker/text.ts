import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { NFT_TICKER_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { ChartStyle, handleNftTicker } from "./processor"

const command: Command = {
  id: "nft_ticker",
  command: "ticker",
  brief: "Check an NFT collection ticker",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const symbol = args[2]
    const chartInput = args[3] ?? "plot"
    const chartStyle = chartInput === "plot" ? ChartStyle.Plot : ChartStyle.Line
    // render embed to show multiple results
    return await handleNftTicker(msg, symbol, msg.author.id, chartStyle)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft ticker <collection_symbol>`,
          examples: `${PREFIX}nft ticker neko`,
          document: NFT_TICKER_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
