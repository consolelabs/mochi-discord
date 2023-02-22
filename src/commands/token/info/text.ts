import { CommandArgumentError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleTokenInfo } from "./processor"

const command: Command = {
  id: "info_server_token",
  command: "info",
  brief: "Information of a token",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const [token] = args.slice(2)
    if (!token) {
      throw new CommandArgumentError({
        message: msg,
        getHelpMessage: () => command.getHelpMessage(msg),
      })
    }
    return await handleTokenInfo(msg, token)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens info <symbol>\n${PREFIX}tokens info <id>`,
        examples: `${PREFIX}tokens info eth\n${PREFIX}tokens info ethereum`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  minArguments: 3,
  colorType: "Defi",
}

export default command
