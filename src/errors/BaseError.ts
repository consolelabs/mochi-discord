import { Message, TextChannel } from "discord.js"
import { logger } from "logger"
import { getErrorEmbed } from "utils/discordEmbed"

export class BotBaseError extends Error {
  private msg?: Message
  constructor(message?: Message) {
    super()
    this.name = "Something went wrong"
    if (message) {
      this.msg = message
      const channel = message.channel as TextChannel
      this.message = JSON.stringify({
        guild: message.guild?.name,
        channel: channel?.name,
        user: message.author.tag,
      })
    }
  }

  handle() {
    logger.error(this)
    if (this.msg) {
      this.msg.reply({ embeds: [getErrorEmbed({ msg: this.msg })] })
    }
  }
}
