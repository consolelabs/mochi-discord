import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  getErrorEmbed,
  composeEmbedMessage,
  composeSimpleSelection,
} from "utils/discordEmbed"
import community from "adapters/community"
import { shortenHashOrAddress } from "utils/common"

const command: Command = {
  id: "sales_list",
  command: "list",
  brief: "See trackers",
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
                  `\`${shortenHashOrAddress(
                    c.contract_address
                  )}\` - platform id ${c.platform}`
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
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
}

export default command
