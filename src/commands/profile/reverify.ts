import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "reverify",
  command: "reverify",
  category: "Profile",
  name: "Reverify",
  run: async(msg) => ({messageOptions: await workInProgress(msg)}),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  experimental: true,
}

export default command
