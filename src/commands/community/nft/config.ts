import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"
import config from "adapters/config"

const command: Command = {
  id: "nft_config_twitter-sale",
  command: "config twitter-sale",
  brief: "Config twitter sales bot",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const csmrKey = args[3]
    const csmrKeyScrt = args[4]
    const acsToken = args[5]
    const acsTokenScrt = args[6]
    await config.createTwitterConfig(
      msg.guildId,
      csmrKey,
      csmrKeyScrt,
      acsToken,
      acsTokenScrt
    )
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Twitter sale config",
            description: `Successfully set configs.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft config twitter-sale <consumer_key> <consumer_key_secret> <access_token> <access_token_secret>`,
        examples: `${PREFIX}nft config twitter-sale J9ts... hNl8... 1450... POvv...`,
      }),
    ],
  }),
  canRunWithoutAction: false,
  colorType: "Market",
  minArguments: 5,
}

export default command
