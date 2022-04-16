import { Command } from "types/common"
import { onlyRunInAdminGroup } from "utils/common"
import { ADMIN_PREFIX } from "utils/constants"
import { workInProgress } from "utils/discord-embed"

const command: Command = {
  id: "profile",
  command: "profile",
  name: "Profile",
  category: "Profile",
  checkBeforeRun: async (msg) => {
    if (msg.content.startsWith(ADMIN_PREFIX)) {
      return await onlyRunInAdminGroup(msg)
    }
    return true
  },
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: workInProgress,
  canRunWithoutAction: true,
  isComplexCommand: true,
  alias: ["pro", "prof", "pf", "profiel"],
}

export default command
