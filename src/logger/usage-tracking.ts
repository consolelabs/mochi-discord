import {
  Client,
  CommandInteraction,
  Message,
  MessageEmbed,
  TextChannel,
} from "discord.js"
import { MOCHI_GUILD_ID, USAGE_TRACKING_CHANNEL_ID } from "env"
import { logger } from "logger"

export class UsageTrackingLogger {
  logChannel: TextChannel | null = null

  ready(client: Client) {
    try {
      const guild = client.guilds.cache.get(MOCHI_GUILD_ID)
      if (guild) {
        this.logChannel = guild.channels.cache.get(
          USAGE_TRACKING_CHANNEL_ID
        ) as TextChannel
      }
    } catch (e: any) {
      logger.error(e)
    }
  }

  log(msg: Message | CommandInteraction) {
    if (this.logChannel) {
      let content = ""
      let authorName = ""
      let authorAvatar = ""
      if (msg instanceof Message) {
        content = msg.content
        authorName = msg.author.username
        authorAvatar = msg.author.avatarURL() ?? ""
      }
      if (msg instanceof CommandInteraction) {
        content = `**Slash Command:** ${msg.commandName}`
        authorName = msg.user.username
        authorAvatar = msg.user.avatarURL() ?? ""
      }
      const embed = new MessageEmbed()
        .setTimestamp()
        .setDescription(content)
        .setFooter({ text: authorName, iconURL: authorAvatar })
        .setAuthor({
          name: msg.guild?.name ?? "",
          iconURL: msg.guild?.bannerURL() ?? "",
        })
      this.logChannel.send({
        embeds: [embed],
      })
    }
  }
}

export default new UsageTrackingLogger()
