import { Command } from "commands"
import { workInProgress } from "utils/discord"

export default {
  id: "reputation",
  command: "repuration",
  name: "Reputation",
  category: "Profile",
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  alias: ["rep"],
} as Command
