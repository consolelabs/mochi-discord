import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

const command: Command = {
  id: "verify_remove",
  command: "remove",
  brief: "remove verify channel",
  category: "Community",
  run: async function (msg) {
    await community.deleteVerifyWalletChannel(msg.guildId)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Verify wallet channel",
            description: `Verify wallet channel successfully removed.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify remove`,
        examples: `${PREFIX}verify remove`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  onlyAdministrator: true,
  colorType: "Server",
  minArguments: 2,
}

export default command
