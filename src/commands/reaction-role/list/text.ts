import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import { handleRoleList } from "./processor"

const command: Command = {
  id: "reactionrole_list",
  command: "list",
  brief: "List all active reaction roles",
  category: "Config",
  onlyAdministrator: true,
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}rr list`,
          examples: `${PREFIX}rr list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  run: async (msg: Message) => {
    return {
      messageOptions: {
        ...(await handleRoleList(msg)),
      },
    }
  },
}

export default command
