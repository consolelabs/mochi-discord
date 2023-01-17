import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { handle } from "./processor"

const command: Command = {
  id: "lv-msg_set",
  command: "set",
  brief: "Set levelup message configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg) => {
    const args = getCommandArguments(msg)
    const imageUrl = msg.attachments.first()?.url ?? ""
    return handle(args.slice(2), imageUrl, msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}levelmessage set <message content> [log channel] [image]`,
          examples: `${PREFIX}lm set Congratulation on leveling up #appreciation`,
        }),
      ],
    }
  },
  minArguments: 3,
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
