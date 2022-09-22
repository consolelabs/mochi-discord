import {
  Message,
  MessageEmbed,
  MessageReaction,
  PartialMessageReaction,
  Role,
  User,
} from "discord.js"
import { logger } from "logger"
import { Event } from "."
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import { RoleReactionEvent } from "types/common"
import config from "adapters/config"
import webhook from "adapters/webhook"
import { composeEmbedMessage } from "utils/discordEmbed"

const getRoleById = (msg: Message, roleId: string): Role | undefined => {
  return msg.guild?.roles.cache.find((role) => role.id === roleId)
}

const getReactionIdentifier = (
  _reaction: MessageReaction | PartialMessageReaction
): string => {
  let reaction = ""
  if (_reaction.emoji.id) {
    reaction = "<:" + _reaction.emoji.identifier.toLowerCase() + ">"
  } else {
    reaction = _reaction.emoji.name ?? ""
  }
  return reaction
}

const handleReactionRoleEvent = async (
  _reaction: MessageReaction | PartialMessageReaction,
  user: User
) => {
  const msg = _reaction.message as Message
  const roleReactionEvent: RoleReactionEvent = {
    guild_id: msg.guild?.id ?? "",
    message_id: msg.id,
    reaction: getReactionIdentifier(_reaction),
  }
  const res = await config.handleReactionEvent(roleReactionEvent)
  const role = getRoleById(msg, res.role.id)
  if (res?.role?.id && role) {
    await msg.guild?.members?.cache.get(user.id)?.roles.add(role)
  }
}

const handleRepostableMessageTracking = async (
  _reaction: MessageReaction | PartialMessageReaction
) => {
  const msg = _reaction.message as Message
  const checkRepostableEvent = {
    guild_id: msg.guild?.id ?? "",
    channel_id: msg.channel.id,
    message_id: msg.id,
    reaction: getReactionIdentifier(_reaction),
    reaction_count: _reaction.count,
  }

  const reactionEmoji = getReactionIdentifier(_reaction)

  // check config repost
  const validateRes = await config.listAllRepostReactionConfigs(
    msg.guild?.id ?? ""
  )
  const isConfiguredEmoji = validateRes?.data?.some(
    (conf: any) => conf.emoji?.toLowerCase() === reactionEmoji
  )
  if (!isConfiguredEmoji) {
    return
  }

  const res = await webhook.pushDiscordWebhook(
    "messageReactionAdd",
    checkRepostableEvent
  )
  if (res?.data.repost_channel_id) {
    const { repost_channel_id: repostChannelId } = res.data
    const { channel_id, guild_id, message_id, reaction, reaction_count } =
      checkRepostableEvent

    const channel = msg.guild?.channels.cache.find(
      (c) => c.id === repostChannelId
    )

    if (channel) {
      const originPostURL = `https://discord.com/channels/${guild_id}/${channel_id}/${message_id}`
      const attachments = msg.attachments.map((a) => ({
        url: a.url,
        type: a.contentType?.split("/")[0] ?? "",
      }))
      const attachmentSize = attachments.length
      let embed: MessageEmbed
      if (attachmentSize) {
        const imageURL = attachments.find((a) => a.type === "image")?.url
        const messageContent = msg.content
          ? msg.content
          : "Message contains some attachments"
        embed = composeEmbedMessage(null, {
          author: [msg.author.username, msg.author.avatarURL() ?? ""],
          description: messageContent,
          originalMsgAuthor: msg.author,
          image: imageURL,
          withoutFooter: true,
          thumbnail: msg.guild?.iconURL(),
        }).setFields([{ name: "Source", value: `[Jump!](${originPostURL})` }])
      } else {
        const messageContent = msg.content
          ? msg.content
          : "Message has no content."
        embed = composeEmbedMessage(null, {
          author: [msg.author.username, msg.author.avatarURL() ?? ""],
          description: messageContent,
          originalMsgAuthor: msg.author,
          withoutFooter: true,
          thumbnail: msg.guild?.iconURL(),
        }).setFields([{ name: "Source", value: `[Jump!](${originPostURL})` }])
      }
      if (channel.isText()) {
        channel.send({
          embeds: [embed],
          content: `**${reaction} ${reaction_count}** <#${channel_id}>`,
        })
      }
    }
  }
}

export default {
  name: "messageReactionAdd",
  once: false,
  execute: async (
    _reaction: MessageReaction | PartialMessageReaction,
    user: User
  ) => {
    try {
      if (_reaction.message.partial) await _reaction.message.fetch()
      if (_reaction.partial) await _reaction.fetch()
      if (user.bot) return
      if (!_reaction.message.guild) return

      // check msg config reactionrole
      const emojiResp = await config.listAllReactionRoles(
        _reaction.message.guild.id
      )
      const listMessageID =
        emojiResp?.data?.configs?.map((v: any) => v.message_id) || []
      if (!listMessageID.includes(_reaction.message.id)) {
        return
      }

      await Promise.all([
        handleReactionRoleEvent(_reaction, user).catch(() => null),
        handleRepostableMessageTracking(_reaction).catch(() => null),
      ])
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"messageReactionAdd">')
    }
  },
} as Event<"messageReactionAdd">
