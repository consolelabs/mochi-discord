import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "profile",
  command: "profile",
  brief: "Profile",
  category: "Profile",
  run: async _msg => ({ messageOptions: await workInProgress() }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  aliases: ["pro", "pf"],
  experimental: true
}

export default command
