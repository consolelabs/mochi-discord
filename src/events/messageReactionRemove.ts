import { Message, MessageReaction, PartialMessageReaction, Role, User } from "discord.js"
import { DISCORD_BOT_GUILD_ID, DISCORD_GET_ROLE_CHANNEL_ID } from "env"
import { logger } from "logger"
import { Event } from "."
import { BotBaseError } from "errors";
import ChannelLogger from "utils/ChannelLogger";
import { ReactionRole, ReactionRoleConfigResponse } from "types/common";
import reactionRole from "adapters/reactionRole";

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
      const configs: ReactionRoleConfigResponse = await reactionRole.getAllReactionConfigs(DISCORD_BOT_GUILD_ID)
      const currentConf = configs.data.filter(conf => conf.message_id === msg.id)[0]
      const roles: ReactionRole[] = JSON.parse(currentConf.reaction_roles)

      if (roles?.length) {
        roles.forEach(async r => {
          if (_reaction.emoji.name === r.reaction) {
            await _reaction.message.guild.members.cache.get(user.id).roles.remove(getRoleByName(msg, r.role_name))
          }
        });
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
