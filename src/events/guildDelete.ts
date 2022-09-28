import { Event } from "."
import Discord from "discord.js"
import webhook from "adapters/webhook"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"

export default {
  name: "guildDelete",
  once: false,
  execute: async (guild: Discord.Guild) => {
    logger.info(`Left guild: ${guild.name} (id: ${guild.id}).`)

    try {
      const data = {
        guild_id: guild.id,
        guild_name: guild.name,
        icon_url: guild.iconURL({ format: "png" }),
      }
      await webhook.pushDiscordWebhook("guildDelete", data)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"guildDelete">')
    }
  },
} as Event<"guildDelete">
