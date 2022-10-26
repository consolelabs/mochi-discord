import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "verify_set",
  command: "set",
  brief: "Create verify wallet channel",
  category: "Community",
  run: async function (msg) {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const existChannel = await community.getVerifyWalletChannel(msg.guild.id)
    if (existChannel.ok && existChannel.data?.verify_channel_id) {
      throw new CommandError({
        message: msg,
        description: `Your server already setup a channel for that -> <#${existChannel.data.verify_channel_id}>`,
      })
    }
    const args = getCommandArguments(msg)
    const { isChannel, value: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      throw new CommandError({
        message: msg,
        description: "Invalid channel. Please choose another one!",
      })
    }

    let roleId
    if (args[3]) {
      const { isRole, value: id } = parseDiscordToken(args[3])
      if (id) {
        if (isRole) {
          roleId = id
        } else {
          throw new CommandError({
            message: msg,
            description: "Invalid role. Please choose another one!",
          })
        }
      }
    }

    const createVerifyWalletRequest = {
      verify_channel_id: channelId,
      guild_id: msg.guild.id,
      ...(roleId ? { verify_role_id: roleId } : {}),
    }

    const res = await community.createVerifyWalletChannel(
      createVerifyWalletRequest
    )
    if (!res.ok) {
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Channel set",
            description: `Mochi sent verify instructions to <#${channelId}> channel${
              roleId
                ? `. In addition, user will be assigned role <@&${roleId}> upon successful verification`
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
