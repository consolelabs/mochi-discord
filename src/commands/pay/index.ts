import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import link from "./link/text"

const actions: Record<string, Command> = {
  link,
}

const textCmd: Command = {
  id: "pay",
  command: "pay",
  brief: "",
  category: "Defi",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Payment",
        usage: `${PREFIX}pay <action>`,
        examples: `${PREFIX}pay link`,
        description: "Generate pay links to share with others.",
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Wallet",
  canRunWithoutAction: false,
  allowDM: true,
}

export default { textCmd }
