import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { SplitMarketplaceLink, CheckMarketplaceLink } from "utils/marketplace"
import { executeNftIntegrateCommand } from "./processor"

const command: Command = {
  id: "integrate_nft",
  command: "integrate",
  brief: "Integrate an NFT collection",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    // case add marketplace link
    // $nft integrate https://opensea.io/collection/cryptodickbutts-s3
    if (args.length == 3) {
      if (CheckMarketplaceLink(args[2])) {
        const platform = SplitMarketplaceLink(args[2])
        args.push(platform)
      } else {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
    }
    return executeNftIntegrateCommand(
      args[2],
      args[3],
      msg.author.id,
      msg.guildId ?? "",
      msg
    )
  },
  getHelpMessage: async function (msg) {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          title: this.brief,
          usage: `${PREFIX}nft integrate <address> <chain_id>`,
          examples: `${PREFIX}nft integrate 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 5\n${PREFIX}mochi integrate 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
