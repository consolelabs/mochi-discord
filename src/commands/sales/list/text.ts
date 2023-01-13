import { Command } from "types/common"
import { PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "discord/embed/ui"
import { handleSalesList } from "./processor"

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
    return await handleSalesList(msg, msg.guildId)
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
