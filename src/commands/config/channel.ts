import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "channel",
  brief: "Setup channels to receive notifications",
  command: "channel",
  aliases: ["chan", "chans", "channels"],
  category: "Config",
  canRunWithoutAction: true,
  run: async _msg => ({
    messageOptions: await workInProgress()
  }),
  getHelpMessage: workInProgress,
  experimental: true
}

export default command
