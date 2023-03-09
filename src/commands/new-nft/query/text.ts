import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { SPACE } from "utils/constants"
import { queryNft } from "./processor"

const command: Command = {
  id: "nft_query",
  command: "query",
  brief: "View NFT token info",
  category: "Community",
  getHelpMessage: async () => {
    return {}
  },
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const symbol = args.slice(1, -1).join(SPACE).toUpperCase()
    const tokenId = args.slice(-1)[0]
    await queryNft(msg, symbol, tokenId)
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
