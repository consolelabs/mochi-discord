import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { handleRoleRemove } from "./processor"

const command: Command = {
  id: "reactionrole_remove",
  command: "remove",
  brief: "Remove a reaction role configuration",
  category: "Config",
  onlyAdministrator: true,
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `To remove a specific configuration in a message\n${PREFIX}rr remove <message_link> <emoji> <role>\n\nTo clear all configurations in a message\n${PREFIX}rr remove <message_link>`,
          examples: `${PREFIX}rr remove https://discord.com/channels/...4875 ✅ @Visitor\n${PREFIX}rr remove https://discord.com/channels/...4875`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    return {
      messageOptions: {
        ...(await handleRoleRemove(args, msg)),
      },
    }
  },
}

export default command
