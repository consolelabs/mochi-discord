import { Command } from "types/common"
import { runVerify } from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"

const command: Command = {
  id: "verify_info",
  command: "info",
  brief: "Show verify wallet channel",
  category: "Community",
  run: (msg) => runVerify(msg, msg.guildId),
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify info`,
        examples: `${PREFIX}verify info`,
        document: `${VERIFY_WALLET_GITBOOK}&action=info`,
        footer: [`Type ${PREFIX}help verify <action> for a specific action!`],
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 2,
  onlyAdministrator: true,
}

export default command
