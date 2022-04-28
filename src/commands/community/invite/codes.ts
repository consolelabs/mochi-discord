import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "invite_codes",
  command: "codes",
  brief: "Show all your invite codes",
  category: "Community",
  run: async _msg => ({ messageOptions: await workInProgress() }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true
}

export default command
