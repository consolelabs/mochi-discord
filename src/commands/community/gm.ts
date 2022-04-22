import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "gm",
  command: "gm",
  name: "GM",
  category: "Community",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  experimental: true,
}

export default command
