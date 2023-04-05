import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import link from "./link/text"
import me from "./me/text"
import tip from "../new-tip/index/text"

const actions: Record<string, Command> = {
  link,
  me,
}

const textCmd: Command = {
  id: "pay",
  command: "pay",
  brief: "Finish all due payments right in Discord",
  category: "Defi",
  run: tip,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Payment",
        usage: `${PREFIX}pay <action>`,
        examples: `${PREFIX}pay me\n${PREFIX}pay link\n${PREFIX}pay link 0.1 ftm`,
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Wallet",
  canRunWithoutAction: true,
  allowDM: true,
}

export default { textCmd }
