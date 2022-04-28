import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "reverify",
  command: "reverify",
  category: "Profile",
  brief: "Reverify",
  run: async _msg => ({ messageOptions: await workInProgress() }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  experimental: true
}

export default command
