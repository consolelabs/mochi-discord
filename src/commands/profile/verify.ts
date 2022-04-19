import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "verify",
  command: "verify",
  category: "Profile",
  name: "Verify",
  run: async(msg) => ({messageOptions: await workInProgress(msg)}),
  getHelpMessage: workInProgress,
  alias: ["join"],
  canRunWithoutAction: true,
  experimental: true,
}

export default command
