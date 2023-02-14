import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, MIX_ROLE_GITBOOK } from "utils/constants"
import { process } from "./processor"

const command: Command = {
  id: "mr_remove",
  command: "remove",
  brief: "Remove a mix role setup",
  category: "Config",
  onlyAdministrator: true,
  run: process,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}mr remove`,
        examples: `${PREFIX}mr remove`,
        document: `${MIX_ROLE_GITBOOK}&action=remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
