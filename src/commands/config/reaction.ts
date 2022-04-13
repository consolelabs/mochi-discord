import { Command } from "types/common"
import {
  onlyRunInAdminGroup,
	workInProgress,
} from "utils/discord"

const command: Command = {
  id: "reaction",
  name: "Setup reactions for users to self-assign their roles",
  command: "reaction",
  alias: ["react", "reacts", "reactions"],
  category: "Config",
  canRunWithoutAction: true,
  checkBeforeRun: onlyRunInAdminGroup,
  run: async (msg) => ({
    messageOptions: await workInProgress(msg),
  }),
  getHelpMessage: workInProgress,
}

export default command
