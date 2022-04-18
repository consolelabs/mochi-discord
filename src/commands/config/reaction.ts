import { Command } from "types/common"
import { onlyRunInAdminGroup } from "utils/common"
import { workInProgress } from "utils/discord-embed"

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
  experimental: true,
}

export default command
