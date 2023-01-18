import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
// text
import info from "./info/text"
import remove from "./remove/text"
import set from "./set/text"

const actions: Record<string, Command> = {
  info,
  remove,
  set,
}

const textCmd: Command = {
  id: "levelmessage",
  command: "levelmessage",
  brief: "Leveled-up message",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  featured: {
    title: "Leveled-up message",
    description:
      "Set up an encouraging leveled-up message when each user is leveled.",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Leveled-up Message",
        description: `Set up an encouraging leveled-up message when each user is leveled.\n${getEmoji(
          "pointingright"
        )} You can use \`$name\` to mention users and \\n to break a paragraph.\n${getEmoji(
          "pointingright"
        )} You can insert an image in leveled-up message by uploading file.`,
        usage: `${PREFIX}levelmessage <action>\n${PREFIX}lm <action>`,
        examples: `${PREFIX}levelmessage info\n${PREFIX}lm set Congratulation on leveling up #appreciation`,
      }),
    ],
  }),
  actions,
  aliases: ["lm"],
  colorType: "Server",
  canRunWithoutAction: false,
}

export default { textCmd }
