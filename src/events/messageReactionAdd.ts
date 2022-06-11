import {
  Message,
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

export default {
  name: "messageReactionAdd",
  once: false,
  execute: async (
    _reaction: MessageReaction | PartialMessageReaction,
    user: User
  ) => {
    if (_reaction.message.partial) await _reaction.message.fetch()
    if (_reaction.partial) await _reaction.fetch()
    if (user.bot) return
    if (!_reaction.message.guild) return

    const msg = _reaction.message as Message

    try {
      const roleReactionEvent: RoleReactionEvent = {
        guild_id: msg.guild.id,
        message_id: msg.id,
        reaction: getReactionIdentifier(_reaction),
      }

      const checkRepostableEvent = {
        guild_id: msg.guild.id,
        channel_id: msg.channel.id,
        message_id: msg.id,
        reaction: getReactionIdentifier(_reaction),
        reaction_count: _reaction.count,
      }

      const promises = [
        config.handleReactionEvent(roleReactionEvent).catch(() => null),
        webhook
          .pushDiscordWebhook("messageReactionAdd", checkRepostableEvent)
          .catch(() => null),
      ]

      const res = await Promise.all(promises)

      if (res[0]?.role?.id) {
        await msg.guild.members?.cache
          .get(user.id)
          ?.roles.add(getRoleById(msg, res[0].role.id))
      }

      if (res[1]?.status === "OK") {
        const repostChannelId = res[1].repost_channel_id
        const { channel_id, guild_id, message_id, reaction, reaction_count } =
          checkRepostableEvent
        const channel = msg.guild.channels.cache.find(
          (c) => c.id === repostChannelId
        ) as TextChannel
        if (channel) {
          const originPostURL = `https://discord.com/channels/${guild_id}/${channel_id}/${message_id}`
          const embed = composeEmbedMessage(null, {
            author: [msg.author.username, msg.author.avatarURL()],
            description:
              msg.content +
              `\n\n**Original post at** [<#${channel_id}>](${originPostURL})`,
            originalMsgAuthor: msg.author,
          })
          channel.send({
            embeds: [embed],
            content: `Congrats. This post've got ${reaction_count} ${reaction} !`,
          })
        }
      }
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
