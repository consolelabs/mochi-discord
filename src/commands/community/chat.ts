import { Command } from "types/common"
import { workInProgress } from "utils/discord"

const command: Command = {
  id: "chat",
  command: "chat",
  name: "Chat",
  category: "Community",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
}

export default command
