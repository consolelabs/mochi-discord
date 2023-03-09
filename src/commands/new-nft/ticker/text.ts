import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { NFT_TICKER_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
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
    const [symbol, chartInput = "plot"] = args.slice(2)
    const chartStyle = chartInput === "plot" ? ChartStyle.Plot : ChartStyle.Line
    // render embed to show multiple results
    await handleNftTicker(msg, symbol, chartStyle)
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
