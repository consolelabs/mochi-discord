import { Command } from "types/common"
import { PREFIX, MIX_ROLE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { process } from "./processor"

const command: Command = {
  id: "mr_list",
  command: "list",
  brief: "List all the mix role setup",
  category: "Config",
  onlyAdministrator: true,
  run: process,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}mr list`,
        examples: `${PREFIX}mr list`,
        document: `${MIX_ROLE_GITBOOK}&action=list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
