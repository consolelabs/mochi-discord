import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "channel",
  brief: "Guild configurations",
  command: "channel",
  category: "Config",
  canRunWithoutAction: true,
  run: async _msg => ({
    messageOptions: await workInProgress()
  }),
  getHelpMessage: workInProgress
}

export default command
