import { Command } from "types/common"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "invite_leaderboard",
  command: "leaderboard",
  name: "See the top inviters",
  category: "Community",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  alias: ["inviteleaderboard", "invite_lead", "invitelead"],
  experimental: true,
}

export default command
