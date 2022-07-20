import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import wallet from "./wallet"

const actions: Record<string, Command> = {
  wallet,
}

const command: Command = {
  id: "verify",
  command: "verify",
  brief: "Verify wallet",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify <action>`,
        footer: [`Type ${PREFIX}help verify for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
