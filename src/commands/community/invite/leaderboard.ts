import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "invites_leaderboard",
  command: "leaderboard",
  name: "Show top 10 inviters",
  category: "Community",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
}

export default command
