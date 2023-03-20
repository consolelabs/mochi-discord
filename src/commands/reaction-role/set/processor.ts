import { CommandInteraction, Message } from "discord.js"
import { GuildIdNotFoundError, InternalError, APIError } from "errors"
import { RoleReactionEvent } from "types/config"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import { isDiscordMessageLink, getEmoji } from "utils/common"
import { throwOnInvalidEmoji } from "utils/emoji"
import { emojis, getEmojiURL, msgColors } from "./../../../utils/common"
import config from "adapters/config"
import { PREFIX } from "utils/constants"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_FEEDBACK,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { SendActivityMsg } from "utils/activity"

const troubleshootMsg = `\n\n${getEmoji(
  "POINTINGRIGHT"
)} _Click “More” on your messages then choose “Copy Message Link”._\n${getEmoji(
  "POINTINGRIGHT"
)} _Or go [here](https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles) for instructions._`

export const handleRoleSet = async (
  args: string[],
  msg: Message | CommandInteraction
) => {
  const { guildId, channelId, roleId, reactMessage, reaction } =
    await validateCommandArgument(args, msg)

  const requestData: RoleReactionEvent = {
    guild_id: guildId,
    message_id: reactMessage.id,
    reaction,
    role_id: roleId,
    channel_id: channelId,
  }

  const res = await config.updateReactionConfig(requestData)
  if (!res.ok) {
    if (res.originalError?.includes("role has been used")) {
      throw new InternalError({
        msgOrInteraction: msg,
        title: "Role has been used",
        description: `Use another role to set the reaction role\n${getEmoji(
          "POINTINGRIGHT"
        )} To see used roles, run $rr list\n${getEmoji(
          "POINTINGRIGHT"
        )} Type \`@\` to see a role list. \n${getEmoji(
          "POINTINGRIGHT"
        )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role`,
      })
    } else {
      throw new InternalError({
        msgOrInteraction: msg,
        description: `Message not found, please choose another valid message.${troubleshootMsg}`,
      })
    }
  }

  await reactMessage.react(requestData.reaction).catch(() => null)
  const embed = composeEmbedMessage(null, {
    author: ["Reaction role set!", getEmojiURL(emojis["APPROVE"])],
    description: `Emoji ${requestData.reaction} is now set to this role <@&${requestData.role_id}>`,
    color: msgColors.SUCCESS,
  })

  // send activity
  const isTextCommand = msg instanceof Message
  const userId = isTextCommand ? msg.author.id : ""
  const role = msg?.guild?.roles?.cache.get(roleId)

  const dataProfile = await profile.getByDiscord(userId)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }
  const kafkaMsg: KafkaQueueActivityDataCommand = {
    platform: "discord",
    activity: {
      profile_id: dataProfile.id,
      status: MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      platform: MOCHI_APP_SERVICE,
      action: MOCHI_ACTION_FEEDBACK,
      content: {
        username: "",
        amount: "",
        token: "",
        server_name: "",
        number_of_user: "",
        role_name: role?.name,
        channel_name: "",
        token_name: "",
        moniker_name: "",
        address: "",
      },
    },
  }
  SendActivityMsg(kafkaMsg)

  return {
    embeds: [embed],
  }
}

export const handleRoleSetHelpCmd = async (msg: Message) => {
  return {
    embeds: [
      composeEmbedMessage(msg, {
        description: `Don't know where to get the message link?${troubleshootMsg}\n\n*Note:\n${getEmoji(
          "POINTINGRIGHT"
        )} Please use the **custom emoji from this server** and the **Discord default emoji**.*`,
        usage: `${PREFIX}rr set <message_link> <emoji> <role>`,
        examples: `${PREFIX}reactionrole set https://discord.com/channels/...4875 ✅ @Visitor`,
      }),
    ],
  }
}

export const validateCommandArgument = async (
  args: string[],
  msg: Message | CommandInteraction
) => {
  if (!msg.guild) {
    throw new GuildIdNotFoundError({ message: msg })
  }
  // Validate message link https://discord.com/channels/guild_id/chan_id/msg_id
  if (!isDiscordMessageLink(args[2])) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Invalid message link",
      description: `Your message link is invalid. Make sure that message exists, or that you have entered the link correctly.${troubleshootMsg}`,
    })
  }

  // Validate input reaction emoji
  const reaction = args[3]
  throwOnInvalidEmoji(reaction, msg)

  // Validate role id args
  const { isRole, value: roleId } = parseDiscordToken(args[4])
  if (!isRole || !roleId) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Invalid roles",
      description: `Your role is invalid. Make sure that role exists, or that you have entered it correctly.\n\n${getEmoji(
        "POINTINGRIGHT"
      )} Type \`@\` to see a role list. \n${getEmoji(
        "POINTINGRIGHT"
      )} To add a new role: 1. Server setting → 2. Roles → 3. Create Role`,
    })
  }

  const [guildId, channelId, messageId] = args[2].split("/").slice(-3)
  if (guildId !== msg.guildId) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: `Guild ID invalid, please choose a message belongs to your guild.${troubleshootMsg}`,
    })
  }

  const channel = msg.guild.channels.cache.get(channelId) // user already has message in the channel => channel in cache
  if (!channel || !channel.isText()) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: `Channel invalid, please choose a message in a text channel.${troubleshootMsg}`,
    })
  }

  const reactMessage = await channel.messages.fetch(messageId).catch(() => null)
  if (!reactMessage) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: `Message not found, please choose another valid message.${troubleshootMsg}`,
    })
  }

  return {
    guildId: msg.guild.id,
    channelId: channel.id,
    roleId,
    reactMessage,
    reaction,
  }
}
