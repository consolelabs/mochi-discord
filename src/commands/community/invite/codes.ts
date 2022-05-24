import { Command } from "types/common"
import { workInProgress } from "utils/discordEmbed"

const command: Command = {
  id: "invite_codes",
  command: "codes",
  brief: "Show all your invite codes",
  category: "Community",
  run: async () => ({ messageOptions: await workInProgress() }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true
}

export default command
