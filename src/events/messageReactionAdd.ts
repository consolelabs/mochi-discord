import {
  Message,
  MessageEmbed,
  MessageReaction,
  PartialMessageReaction,
  Role,
  TextChannel,
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
import { reactionPoker } from "commands/games/poker"

const getRoleById = (msg: Message, roleId: string): Role => {
  return msg.guild.roles.cache.find((role) => role.id === roleId)
}

const getReactionIdentifier = (
  _reaction: MessageReaction | PartialMessageReaction
): string => {
  let reaction = ""
  if (_reaction.emoji.id) {
    reaction = "<:" + _reaction.emoji.identifier.toLowerCase() + ">"
  } else {
    reaction = _reaction.emoji.name
  }
  return reaction
}

const handleReactionRoleEvent = async (
  _reaction: MessageReaction | PartialMessageReaction,
  user: User
) => {
  const msg = _reaction.message as Message
  const roleReactionEvent: RoleReactionEvent = {
    guild_id: msg.guild.id,
    message_id: msg.id,
    reaction: getReactionIdentifier(_reaction),
  }
  const res = await config.handleReactionEvent(roleReactionEvent)
  if (res?.role?.id) {
    await msg.guild.members?.cache
      .get(user.id)
      ?.roles.add(getRoleById(msg, res.role.id))
  }
}

const handleRepostableMessageTracking = async (
  _reaction: MessageReaction | PartialMessageReaction
) => {
  const msg = _reaction.message as Message
  const checkRepostableEvent = {
    guild_id: msg.guild.id,
    channel_id: msg.channel.id,
    message_id: msg.id,
    reaction: getReactionIdentifier(_reaction),
    reaction_count: _reaction.count,
  }
  const res = await webhook.pushDiscordWebhook(
    "messageReactionAdd",
    checkRepostableEvent
  )
  if (res?.status === "OK") {
    const { repost_channel_id: repostChannelId } = res
    const { channel_id, guild_id, message_id, reaction, reaction_count } =
      checkRepostableEvent

    const channel = msg.guild.channels.cache.find(
      (c) => c.id === repostChannelId
    ) as TextChannel

    if (channel) {
      const originPostURL = `https://discord.com/channels/${guild_id}/${channel_id}/${message_id}`
      const attachments = msg.attachments.map((a) => ({
        url: a.url,
        type: a.contentType.split("/")[0],
      }))
      const attachmentSize = attachments.length
      let embed: MessageEmbed
      if (attachmentSize) {
        const imageURL = attachments.find((a) => a.type === "image")?.url
        const messageContent = msg.content
          ? msg.content
          : "Message contains some attachments"
        embed = composeEmbedMessage(null, {
          author: [msg.author.username, msg.author.avatarURL()],
          description: messageContent,
          originalMsgAuthor: msg.author,
          image: imageURL,
          withoutFooter: true,
          thumbnail: msg.guild.iconURL(),
        }).setFields([{ name: "Source", value: `[Jump!](${originPostURL})` }])
      } else {
        const messageContent = msg.content
          ? msg.content
          : "Message has no content."
        embed = composeEmbedMessage(null, {
          author: [msg.author.username, msg.author.avatarURL()],
          description: messageContent,
          originalMsgAuthor: msg.author,
          withoutFooter: true,
          thumbnail: msg.guild.iconURL(),
        }).setFields([{ name: "Source", value: `[Jump!](${originPostURL})` }])
      }
      channel.send({
        embeds: [embed],
        content: `**${reaction} ${reaction_count}** <#${channel_id}>`,
      })
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

      // TODO: uncomment this
      // await Promise.all([
      //   handleReactionRoleEvent(_reaction, user).catch(() => null),
      //   handleRepostableMessageTracking(_reaction).catch(() => null),
      // ])

      // join poker game if it's the right message in the right channel
      reactionPoker(_reaction as MessageReaction, user)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"messageReactionAdd">
