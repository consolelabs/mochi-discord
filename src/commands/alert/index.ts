import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import list from "./list/text"
import remove from "./remove/text"
import add from "./add/text"

const actions: Record<string, Command> = {
  list,
  remove,
  add,
}

const textCmd: Command = {
  id: "alert",
  command: "alert",
  brief: "Alert Configuration",
  category: "Defi",
  run: async () => null,
  featured: {
    title: "Alert",
    description: "Get notifications every time the price change",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}alert <action>`,
        examples: `${PREFIX}alert list\n${PREFIX}alert add ftm`,
        description: "Get notifications every time the price change",
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Defi",
  canRunWithoutAction: false,
}

export default { textCmd }
