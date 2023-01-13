import { Command } from "types/common"
import { runVerifySet } from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"

const command: Command = {
  id: "verify_set",
  command: "set",
  brief: "Create verify wallet channel",
  category: "Community",
  run: (msg) => runVerifySet({ msg, guildId: msg.guildId }),
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify set <channel> [<verified_role>]`,
        examples: `${PREFIX}verify set #general\n${PREFIX}verify set #connect-wallet @verified`,
        document: `${VERIFY_WALLET_GITBOOK}&action=set`,
        footer: [`Type ${PREFIX}help verify <action> for a specific action!`],
      }),
    ],
  }),
  canRunWithoutAction: true,
  onlyAdministrator: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
