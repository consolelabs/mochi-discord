import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "profile",
  command: "profile",
  name: "Profile",
  category: "Profile",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  alias: ["pro", "prof", "pf", "profiel"],
  experimental: true,
}

export default command
