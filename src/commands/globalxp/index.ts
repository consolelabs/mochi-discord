import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import globalxp from "./index/text"

const command: Command = {
  id: "globalxp",
  command: "globalxp",
  brief: "Toggle global XP for this server",
  category: "Config",
  onlyAdministrator: true,
  run: globalxp,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}globalxp`,
        examples: `${PREFIX}globalxp`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
