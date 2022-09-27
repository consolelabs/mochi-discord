import {
  Message,
  MessageReaction,
  PartialMessageReaction,
  User,
} from "discord.js"
import { logger } from "logger"
import { Event } from "."
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import webhook from "adapters/webhook"
import { getReactionIdentifier } from "utils/commands"

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
      const body = {
        guild_id: msg.guild?.id ?? "",
        channel_id: msg.channel.id,
        message_id: msg.id,
        reaction: getReactionIdentifier(_reaction.emoji.id,_reaction.emoji.name,_reaction.emoji.identifier.toLowerCase()),
        reaction_count: _reaction.count,
        user_id: user.id,
      }

      await webhook.pushDiscordWebhook("messageReactionRemove", body)
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
