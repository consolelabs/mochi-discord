import community from "adapters/community"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, InternalError, GuildIdNotFoundError } from "errors"
import { CommandInteraction, Message } from "discord.js"
import { getEmoji } from "utils/common"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_VERIFY,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"

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
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Invalid channel",
        description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true,
        )} Type # to see the channel list.\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true,
        )} To add a new channel: 1. Create channel → 2. Confirm`,
      })
    }
    channelId = value

    if (args[3]) {
      const { isRole, value } = parseDiscordToken(args[3])
      if (!isRole || !value) {
        throw new InternalError({
          msgOrInteraction: msg,
          title: "Invalid role",
          description: `Your role is invalid. Make sure that role exists, or that you have entered it correctly.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} Type @ to see the role list.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role.`,
        })
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
            title: "Verified channel error",
            description: `The current verified channel is <#${
              existChannel.data.verify_channel_id
            }>.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} You need to remove the existing configuration first via \`verify remove\`, before setting a new one.`,
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
    createVerifyWalletRequest,
  )
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
      error: res.error,
    })
  }

  // send activity
  const channel = msg?.guild?.channels.cache.get(channelId)
  const isTextCommand = msg instanceof Message
  const userId = isTextCommand ? msg.author.id : interaction?.user.id
  const dataProfile = await profile.getByDiscord(userId as string)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: res.curl,
      status: res.status ?? 500,
      error: res.error,
    })
  }
  const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
    dataProfile.id,
    MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
    MOCHI_APP_SERVICE,
    MOCHI_ACTION_VERIFY,
  )
  kafkaMsg.activity.content.channel_name = channel?.name
  sendActivityMsg(kafkaMsg)

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
