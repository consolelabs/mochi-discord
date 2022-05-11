import { Event } from "."
import Discord from "discord.js"
import config from "../adapters/config"
import webhook from "adapters/webhook"

export default {
  name: "guildCreate",
  once: false,
  execute: async (guild: Discord.Guild) => {
    console.log(
      `Joined guild: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
    )

    try {
      await config.createGuild(guild.id, guild.name)
      await webhook.pushDiscordWebhook("guildCreate", {
        guild_id: guild.id
      })
    } catch (err) {
      console.error(err)
    }
  }
} as Event<"guildCreate">

