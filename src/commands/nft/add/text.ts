import { ADD_COLLECTION_GITBOOK } from "utils/constants"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { SplitMarketplaceLink, CheckMarketplaceLink } from "utils/marketplace"
import { executeNftAddCommand } from "./processor"

const command: Command = {
  id: "add_nft",
  command: "add",
  brief: "Add an NFT collection",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    // case add marketplace link
    // $nft add https://opensea.io/collection/cryptodickbutts-s3
    if (args.length == 3) {
      if (CheckMarketplaceLink(args[2])) {
        const platform = SplitMarketplaceLink(args[2])
        args.push(platform)
      } else {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
    }

    return executeNftAddCommand(args, msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `To add a collection on EVM chain (ETH and FTM), use:\n${PREFIX}nft add <address> <chain_id/chain_symbol>\n\nTo add a collection on Solana:\n$nft add <collection_id> <chain_id/chain_symbol>`,
          examples: `${PREFIX}nft add 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm\n${PREFIX}mochi add 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 5\n${PREFIX}nft add https://opensea.io/collection/tykes`,
          document: ADD_COLLECTION_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
