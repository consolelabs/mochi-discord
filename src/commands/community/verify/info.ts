import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "verify_info",
  command: "info",
  brief: "Show verify wallet channel",
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
    if (!res.ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: res.error,
            }),
          ],
        },
      }
    }
    if (!res.data) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: msg.guild.name,
              description: `No config found`,
            }),
          ],
        },
      }
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: msg.guild.name,
            description: `Channel: <#${res.data.verify_channel_id}>`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify info`,
        examples: `${PREFIX}verify info`,
        document: VERIFY_WALLET_GITBOOK,
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
