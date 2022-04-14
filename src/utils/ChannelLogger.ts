import { Client, MessageEmbed, TextChannel } from "discord.js"
import { LOG_CHANNEL_ID } from "env"
import { BotBaseError } from "errors"
import { logger } from "logger"

export class ChannelLogger {
  logChannel: TextChannel = null

  async ready(client: Client) {
    try {
      // only send log to our discord server (pod town)
      // TODO: allow to config log channel
      const guild = await client.guilds.fetch("963487084969095168")
      this.logChannel = (await guild.channels.fetch(
        LOG_CHANNEL_ID
      )) as TextChannel
    } catch (e: any) {
      logger.error(e)
    }
  }

  log(error: BotBaseError) {
    if (this.logChannel) {
      const embed = new MessageEmbed()
        .setTimestamp()
        .setDescription(`\`\`\`${error}\`\`\``)
      this.logChannel.send({
        embeds: [embed],
      })
    }
  }
}

export default new ChannelLogger()
