import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { composeNFTListEmbed } from "./processor"

const command: Command = {
  id: "nft_recent",
  command: "recent",
  brief: "Show list of newly added NFTs",
  category: "Community",
  run: async () => {
    const msgOpts = await composeNFTListEmbed(0)
    return msgOpts
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft recent`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
