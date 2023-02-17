import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { APIError, GuildIdNotFoundError } from "errors"
import { getEmoji } from "utils/common"

const command: Command = {
  id: "verify_remove",
  command: "remove",
  brief: "Unset verify channel",
  category: "Community",
  run: async function (msg) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const infoRes = await community.getVerifyWalletChannel(msg.guild.id)

    if (!infoRes.ok) {
      throw new APIError({
        message: msg,
        curl: infoRes.curl,
        description: infoRes.log,
      })
    }

    if (!infoRes.data) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "No verified channel found",
              description: `You haven't set a channel for verification.\n${getEmoji(
                "POINTING_RIGHT"
              )} To set a new one, run \`verify set #<channel> @<verified role>\`.\n${getEmoji(
                "POINTING_RIGHT"
              )} Then re-check your configuration using \`verify info.\``,
            }),
          ],
        },
      }
    }

    const res = await community.deleteVerifyWalletChannel(msg.guild.id)
    if (!res.ok) {
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Channel removed",
            description: `Instruction message removed\n**NOTE**: not having a channel for verification will limit the capabilities of Mochi, we suggest you set one by running \`$verify set #<channel_name>\``,
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
