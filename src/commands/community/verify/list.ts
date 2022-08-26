import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "verify_list",
  command: "list",
  brief: "show verify channel",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const res = await community.getVerifyWalletChannel(msg.guildId)
    if (res.error) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Verify wallet channel",
              description: `Verify wallet channel is not set.`,
            }),
          ],
        },
      }
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Verify wallet channel",
            description: `Verify wallet channel is config at <#${res.data.verify_channel_id}>.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify list`,
        examples: `${PREFIX}verify list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 2,
  onlyAdministrator: true,
}

export default command
