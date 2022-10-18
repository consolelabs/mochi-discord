import { Command } from "types/common"
import { PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import {
  getErrorEmbed,
  composeEmbedMessage,
  composeSimpleSelection,
} from "utils/discordEmbed"
import community from "adapters/community"
import { capFirst, shortenHashOrAddress } from "utils/common"

const command: Command = {
  id: "sales_list",
  command: "list",
  brief: "Show list of trackers",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const res = await community.getSalesTrackers(msg.guildId)

    if (!res.ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: res.error,
            }),
          ],
        },
      }
    }

    if (!res.data) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              description: `You have no tracker setup`,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Trackers",
            description: `Sending notifications to channel <#${
              res.data.channel_id
            }>:\n${composeSimpleSelection(
              res.data.collection.map(
                (c: any) =>
                  `\`${capFirst(c.name)} (${shortenHashOrAddress(
                    c.contract_address
                  )}) ${c.chain.name}\``
              )
            )}`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sales list`,
        examples: `${PREFIX}sales list`,
        document: `${SALE_TRACKER_GITBOOK}&action=list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
}

export default command
