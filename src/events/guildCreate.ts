import { Event } from "."
import Discord from "discord.js"
import config from "../adapters/config"
import webhook from "adapters/webhook"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"

export default {
  name: "guildCreate",
  once: false,
  execute: async (guild: Discord.Guild) => {
    logger.info(
      `Joined guild: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
    )

    try {
      await config.createGuild(guild.id, guild.name)
      await webhook.pushDiscordWebhook("guildCreate", {
        guild_id: guild.id,
      })
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
} as Event<"guildCreate">
