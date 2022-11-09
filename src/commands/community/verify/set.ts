import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"
import { CommandInteraction, Message } from "discord.js"

export async function runVerifySet({
  msg,
  interaction,
  guildId,
}: {
  msg?: Message
  interaction?: CommandInteraction
  guildId: string | null
}) {
  let channelId: string
  let roleId: string | undefined
  if (msg) {
    const args = getCommandArguments(msg)
    const { isChannel, value } = parseDiscordToken(args[2])
    if (!isChannel) {
      throw new CommandError({
        message: msg,
        description: "Invalid channel. Please choose another one!",
      })
    }
    channelId = value

    if (args[3]) {
      const { isRole, value } = parseDiscordToken(args[3])
      if (value) {
        if (!isRole) {
          throw new CommandError({
            message: msg,
            description: "Invalid role. Please choose another one!",
          })
        }
      }
      roleId = value
    }
  } else if (interaction) {
    const channel = interaction.options.getChannel("channel", true)
    channelId = channel.id
    const role = interaction.options.getRole("role", false)
    roleId = role?.id
  } else {
    return null
  }
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: msg })
  }
  const existChannel = await community.getVerifyWalletChannel(guildId)
  if (existChannel.ok && existChannel.data?.verify_channel_id) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg: msg ?? undefined,
            title: "Verify channel already set",
            description: `Current verify channel is <#${existChannel.data.verify_channel_id}>.\nRemove the current channel by \`$verify remove\` before setting a new one.`,
          }),
        ],
      },
    }
  }

  const createVerifyWalletRequest = {
    verify_channel_id: channelId,
    guild_id: guildId,
    ...(roleId && { verify_role_id: roleId }),
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
}

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
