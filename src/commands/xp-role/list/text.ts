import { Command } from "types/common"
import { PREFIX, XP_ROLE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { process } from "./processor"

const command: Command = {
  id: "xr_list",
  command: "list",
  brief: "List all the xp role setup",
  category: "Config",
  onlyAdministrator: true,
  run: process,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}xr list`,
        examples: `${PREFIX}xr list`,
        document: `${XP_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
