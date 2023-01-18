import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { handle } from "./processor"

const command: Command = {
  id: "lv-msg_info",
  command: "info",
  brief: "Show current levelup message configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg) => {
    return handle(msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}levelmessage info`,
          examples: `${PREFIX}levelmessage info`,
        }),
      ],
    }
  },
  minArguments: 2,
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
