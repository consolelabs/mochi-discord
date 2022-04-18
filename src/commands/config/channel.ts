import { Command } from "types/common"
import {
  onlyRunInAdminGroup,
} from "utils/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "channel",
  name: "Setup channels to receive notifications",
  command: "channel",
  alias: ["chan", "chans", "channels"],
  category: "Config",
  canRunWithoutAction: true,
  checkBeforeRun: onlyRunInAdminGroup,
  run: async (msg) => ({
    messageOptions: await workInProgress(msg),
  }),
  getHelpMessage: workInProgress,
}

export default command
