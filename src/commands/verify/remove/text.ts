import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { runVerifyRemove } from "./processor"

const command: Command = {
  id: "verify_remove",
  command: "remove",
  brief: "Unset verify channel",
  category: "Community",
  run: async (msg) => runVerifyRemove(msg.guildId),
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify remove`,
        examples: `${PREFIX}verify remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  onlyAdministrator: true,
  colorType: "Server",
  minArguments: 2,
}

export default command
