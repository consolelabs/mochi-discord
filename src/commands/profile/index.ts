import { Command } from "types/common"
import { workInProgress } from "utils/discordEmbed"

const command: Command = {
  id: "profile",
  command: "profile",
  brief: "Profile",
  category: "Profile",
  run: async () => ({ messageOptions: await workInProgress() }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  aliases: ["pf"],
  experimental: true
}

export default command
