import { Client, MessageEmbed, TextChannel } from "discord.js"
import { LOG_CHANNEL_ID } from "env"
import { NekoBotBaseError } from "errors"
import { logger } from "logger"

export class ChannelLogger {
  logChannel: TextChannel = null

  async ready(client: Client) {
    try {
      // only send log to our discord server (pod town)
      const guild = await client.guilds.fetch("882287783169896468")
      this.logChannel = (await guild.channels.fetch(
        LOG_CHANNEL_ID
      )) as TextChannel
    } catch (e: any) {
      logger.error(e)
    }
  }

  log(error: NekoBotBaseError) {
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
