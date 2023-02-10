import { Command } from "types/common"
import { PREFIX, STARBOARD_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import list from "./list/text"
import set from "./set/text"
import setChat from "./set_chat/text"
import remove from "./remove/text"
import blacklist from "./blacklist"

const actions: Record<string, Command> = {
  set,
  remove,
  list,
  blacklist,
  "set-chat": setChat,
}

const textCmd: Command = {
  id: "starboard",
  command: "starboard",
  brief: "Starboard configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sb <action>`,
        footer: [`Type ${PREFIX}help sb <action> for a specific action!`],
        description: `Hornor and share well-rated posts with your community\n\n*Note:\n${getEmoji(
          "POINTINGRIGHT"
        )} When setting a new starboard, please use the **custom emoji from this server** and the **Discord default emoji**.* ${getEmoji(
          "nekosad"
        )}`,
        examples: `${PREFIX}starboard list\n${PREFIX}sb list\n${PREFIX}starboard set 2 🌟 #starboard\n${PREFIX}sb set-chat 🌟 ❣️ #starboard`,
        includeCommandsList: true,
        document: STARBOARD_GITBOOK,
      }),
    ],
  }),
  aliases: ["sb"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default { textCmd }
