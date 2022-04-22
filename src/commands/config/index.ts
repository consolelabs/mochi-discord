import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "channel",
  name: "Guild configurations",
  command: "channel",
  alias: ["chan", "chans", "channels"],
  category: "Config",
  canRunWithoutAction: true,
  run: async (msg) => ({
    messageOptions: await workInProgress(msg),
  }),
  getHelpMessage: workInProgress,
}

export default command
