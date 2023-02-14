import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, MIX_ROLE_GITBOOK } from "utils/constants"
import { process } from "./processor"

const command: Command = {
  id: "mixrole_set",
  command: "set",
  brief: "Set up a role using different thresholds.",
  category: "Config",
  onlyAdministrator: true,
  run: process,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}mr set\n${PREFIX}mixrole set`,
        examples: `${PREFIX}mr set\n${PREFIX}mr set`,
        document: `${MIX_ROLE_GITBOOK}&action=set`,
      }),
    ],
  }),
  aliases: ["mr"],
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 2,
}

export default command
