import { Command } from "types/common"
import { workInProgress } from "utils/discordEmbed"

const command: Command = {
  id: "channel",
  brief: "Guild configurations",
  command: "channel",
  category: "Config",
  canRunWithoutAction: true,
  run: async () => ({ messageOptions: await workInProgress() }),
  getHelpMessage: workInProgress
}

export default command
