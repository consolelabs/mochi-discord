import { Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX, VOTE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handle } from "./processor"

const command: Command = {
  id: "vote_remove",
  command: "remove",
  brief: "Remove the configured vote channel",
  category: "Community",
  run: async (msg: Message) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    return await handle(msg.guildId, msg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}vote remove`,
        examples: `${PREFIX}vote remove`,
        includeCommandsList: true,
        document: `${VOTE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  colorType: "Server",
  onlyAdministrator: true,
}

export default command
