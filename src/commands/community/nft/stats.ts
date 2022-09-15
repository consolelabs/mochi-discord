import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getEmoji } from "utils/common"
import { APIError } from "errors"

const command: Command = {
  id: "nft_stats",
  command: "stats",
  brief: "show total collections added",
  category: "Community",
  run: async function (msg) {
    const res = await community.getCollectionCount()
    if (!res.ok) {
      throw new APIError({ message: msg, description: res.log })
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Collections supported",
            description: `
            ${getEmoji("ETH")} ETH: ${res.data.eth_collection} collections\n
            ${getEmoji("FTM")} FTM: ${res.data.ftm_collection} collections\n
            ${getEmoji("OP")} OP: ${res.data.op_collection} collections`,
          }),
        ],
      },
    }
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
