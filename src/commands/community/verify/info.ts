import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { APIError, GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "verify_info",
  command: "info",
  brief: "Show verify wallet channel",
  category: "Community",
  run: async function (msg) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await community.getVerifyWalletChannel(msg.guild.id)
    if (!res.ok) {
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
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
            description: `Verify channel: <#${res.data.verify_channel_id}>${
              res.data.verify_role_id
                ? `. Verify role: <@&${res.data.verify_role_id}>`
                : ""
            }`,
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
