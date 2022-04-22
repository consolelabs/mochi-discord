import { Message, MessageReaction, PartialMessageReaction, Role, User } from "discord.js"
import { DISCORD_GET_ROLE_CHANNEL_ID } from "env"
import { logger } from "logger"
import { Event } from "."
import { reactionRoleConfigs} from "utils/common"; 
import { BotBaseError } from "errors";
import ChannelLogger from "utils/ChannelLogger";

const getRoleByName = (msg: Message, name: string): Role => {
  return msg.guild.roles.cache.find(role => role.name === name);
}

export default {
  name: "messageReactionRemove",
  once: false,
  execute: async (_reaction: MessageReaction | PartialMessageReaction, user: User) => {

    try {

      if (_reaction.message.partial) await _reaction.message.fetch()
      if (_reaction.partial) await _reaction.fetch()
      if (user.bot) return
      if (!_reaction.message.guild) return;
      if (_reaction.message.channel.id !== DISCORD_GET_ROLE_CHANNEL_ID) return;

      const msg = _reaction.message as Message

      reactionRoleConfigs.forEach(async conf => {
        if (_reaction.emoji.name === conf.roleEmoji) {
          await _reaction.message.guild.members.cache.get(user.id).roles.remove(getRoleByName(msg, conf.roleName))
        }
      });

    } catch (e: any) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(e)
    }
  },
} as Event<"messageReactionRemove">
