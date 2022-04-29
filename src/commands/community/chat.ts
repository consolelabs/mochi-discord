import { Command } from "types/common"
import { workInProgress } from "utils/discordEmbed"

const command: Command = {
  id: "chat",
  command: "chat",
  brief: "Chat",
  category: "Community",
  run: async _msg => ({ messageOptions: await workInProgress() }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  experimental: true
}

export default command
