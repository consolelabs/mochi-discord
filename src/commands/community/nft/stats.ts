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
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
    }
    let description = ``
    if (res.data) {
      res.data.data?.forEach((v: any) => {
        description += `${getEmoji(v.chain.currency)} ${v.chain.currency}: ${
          v.count
        } collections\n`
      })
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Collections supported",
            description: description,
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
