import { Message, MessageReaction, PartialMessageReaction, Role, User } from "discord.js"
import { DISCORD_BOT_GUILD_ID, DISCORD_GET_ROLE_CHANNEL_ID } from "env"
import { logger } from "logger"
import { Event } from "."
import { BotBaseError } from "errors";
import ChannelLogger from "utils/ChannelLogger";
import { ReactionRoleResponse, RoleReactionEvent } from "types/common";
import reactionRole from "adapters/reactionRole";

const getRoleById = (msg: Message, roleId: string): Role => {
  return msg.guild.roles.cache.find(role => role.id === roleId);
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
      
      const event: RoleReactionEvent = {
        action_type: 'REMOVE',
        guild_id: msg.guild.id,
        message_id: msg.id,
        reaction: _reaction.emoji.name
      }

      const resData: ReactionRoleResponse = await reactionRole.handleReactionEvent(event)
      
      if (resData?.role?.id) {
        await msg.guild.members.cache.get(user.id).roles.remove(getRoleById(msg, resData.role.id))
      }

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
