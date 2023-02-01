import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, XP_ROLE_GITBOOK } from "utils/constants"
import { process } from "./processor"

const command: Command = {
  id: "xr_remove",
  command: "remove",
  brief: "Remove a xp role setup",
  category: "Config",
  onlyAdministrator: true,
  run: process,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}xr remove`,
        examples: `${PREFIX}xr remove`,
        document: `${XP_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
