import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { handleRoleSetHelpCmd, handleRoleSet } from "./processor"

const command: Command = {
  id: "reactionrole_set",
  command: "set",
  brief: "Set up a new reaction role.",
  category: "Config",
  onlyAdministrator: true,
  getHelpMessage: handleRoleSetHelpCmd,
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 5,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    return {
      messageOptions: {
        ...(await handleRoleSet(args, msg)),
      },
    }
  },
}

export default command
