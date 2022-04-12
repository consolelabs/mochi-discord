import { Command } from "commands"
import { workInProgress } from "utils/discord"

const command: Command = {
  id: "invite_leaderboard",
  command: "leaderboard",
  name: "See the top inviters",
  category: "Profile",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
}

export default command
