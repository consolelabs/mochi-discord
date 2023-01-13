import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX, SALE_TRACKER_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { handleSalesRemove } from "./processor"

const command: Command = {
  id: "track_sales",
  command: "remove",
  brief: "Remove a sales tracker from an NFT collection",
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
    const args = getCommandArguments(msg)
    return await handleSalesRemove(
      msg,
      msg.guildId,
      args[2] ?? "",
      msg.author.id
    )
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `// Interactively\n${PREFIX}sales remove\n\n// If you already know what to remove\n${PREFIX}sales remove <contract-address>`,
        examples: `${PREFIX}sales remove\n${PREFIX}sales remove 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73`,
        document: `${SALE_TRACKER_GITBOOK}&action=remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Marketplace",
}

export default command
