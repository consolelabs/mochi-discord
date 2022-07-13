import { Client, MessageEmbed, TextChannel } from "discord.js"
import { LOG_CHANNEL_ID, MOCHI_GUILD_ID } from "env"
import { BotBaseError } from "errors"
import { logger } from "logger"

export class ChannelLogger {
  logChannel: TextChannel = null

  async ready(client: Client) {
    try {
      // only send log to our discord server (pod town)
      // TODO: allow to config log channel
      const guild = client.guilds.cache.get(MOCHI_GUILD_ID)
      if (guild) {
        this.logChannel = guild.channels.cache.get(
          LOG_CHANNEL_ID
        ) as TextChannel
      }
    } catch (e: any) {
      logger.error(e)
    }
  }

  log(error: BotBaseError, funcName?: string) {
    if (this.logChannel) {
      if (funcName) {
        const embed = new MessageEmbed()
          .setTimestamp()
          .setDescription(
            `\`\`\`bot crashed due to reason: ${funcName} ${error}\`\`\``
          )
        this.logChannel.send({
          embeds: [embed],
        })
      } else {
        const embed = new MessageEmbed()
          .setTimestamp()
          .setDescription(`\`\`\`bot crashed due to reason: ${error}\`\`\``)
        this.logChannel.send({
          embeds: [embed],
        })
      }
    }
  }
}

export default new ChannelLogger()
