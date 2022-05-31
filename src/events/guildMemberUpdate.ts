import { Event } from "."
import Discord from "discord.js"
import webhook from "adapters/webhook"
import { BotBaseError } from "errors"
import { logger } from "../logger"
import ChannelLogger from "utils/ChannelLogger"
import { composeLevelUpMessage } from "utils/userXP"

export default {
  name: "guildMemberUpdate",
  once: false,
  execute: async (oldMember: Discord.GuildMember | Discord.PartialGuildMember, newMember: Discord.GuildMember) => {
    if (oldMember.premiumSince !== newMember.premiumSince) {
      return
    }
    try {
      const resp = await webhook.pushDiscordWebhook("guildMemberUpdate", {
        guild_id: newMember.guild.id,
        user: {
          id: newMember.user.id,
        },
      })

      if (resp.status !== "OK" || resp.error !== undefined) {
        logger.error(resp.error)
        throw new BotBaseError()
      }

      if (!newMember.guild.systemChannelId) {
        return
      }

      const systemChannel = newMember.guild.systemChannel
      const { data, type } = resp
      if (!type || !data) return
      switch (type) {
        case "level_up":
          if (data.level_up) {
            await systemChannel.send(
              await composeLevelUpMessage(
                newMember.id,
                newMember.avatar,
                data.current_level
              )
            )
          }
          return
        default:
          return
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
} as Event<"guildMemberUpdate">