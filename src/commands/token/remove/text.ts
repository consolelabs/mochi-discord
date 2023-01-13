import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "discord/embed/ui"
import { handleTokenRemove } from "./processor"

const command: Command = {
  id: "remove_server_token",
  command: "remove",
  brief: "Remove a token from your server's list",
  onlyAdministrator: true,
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId) {
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
    return await handleTokenRemove(msg.guildId, msg.author.id)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens remove`,
        examples: `${PREFIX}tokens remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["rm"],
  colorType: "Defi",
}

export default command
