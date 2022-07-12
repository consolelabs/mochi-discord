import {
  Message,
  MessageReaction,
  PartialMessageReaction,
  Role,
  User,
} from "discord.js"
import { logger } from "logger"
import { Event } from "."
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import { ReactionRoleResponse, RoleReactionEvent } from "types/common"
import config from "adapters/config"

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
  name: "messageReactionRemove",
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

      const msg = _reaction.message as Message

      const event: RoleReactionEvent = {
        guild_id: msg.guild.id,
        message_id: msg.id,
        reaction: getReactionIdentifier(_reaction),
      }

      const resData: ReactionRoleResponse = await config.handleReactionEvent(
        event
      )

      if (resData?.role?.id) {
        await msg.guild.members?.cache
          .get(user.id)
          ?.roles.remove(getRoleById(msg, resData.role.id))
      }
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"messageReactionRemove">')
    }
  },
} as Event<"messageReactionRemove">
