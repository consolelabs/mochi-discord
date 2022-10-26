import { Command } from "types/common"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import info from "./info"
import remove from "./remove"

const actions: Record<string, Command> = {
  set,
  info,
  remove,
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
        description:
          "Verify your wallet by connecting a Metamask wallet with your Discord server to use all DeFi functions offered by Mochi",
        examples: `${PREFIX}verify info`,
        document: VERIFY_WALLET_GITBOOK,
        footer: [`Type ${PREFIX}help verify <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
