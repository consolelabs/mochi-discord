import { Command } from "types/common"
import { GuildIdNotFoundError } from "errors"
import { PREFIX } from "utils/constants"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"

const command: Command = {
  id: "add_server_token",
  command: "add",
  brief: "Add a token to your server's list",
  category: "Community",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    return await processor.handleTokenAdd(msg, msg.guildId, msg.author.id)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens add`,
        examples: `${PREFIX}tokens add`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
