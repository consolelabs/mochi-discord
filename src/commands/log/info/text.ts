import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { runLogInfo } from "./processor"

const command: Command = {
  id: "log_info",
  command: "info",
  brief: "Show current log channel's info",
  category: "Config",
  onlyAdministrator: true,
  run: (msg) => runLogInfo({ msg, guildId: msg.guildId }),
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}log info`,
        examples: `${PREFIX}log info`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
