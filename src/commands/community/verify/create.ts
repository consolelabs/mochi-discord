import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "verify_create",
  command: "create",
  brief: "Create verify wallet channel",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const channelId = args[2].slice(2, args[2].length - 1)

    const createVerifyWalletRequest = {
      verify_channel_id: channelId,
      guild_id: msg.guildId,
    }

    await community.createVerifyWalletChannel(createVerifyWalletRequest)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Verify wallet channel",
            description: `Successfully created a channel for verifying wallet.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify create <channel>`,
        examples: `${PREFIX}verify create #general`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
