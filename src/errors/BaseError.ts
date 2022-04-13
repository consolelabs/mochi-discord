import { Message, TextChannel } from "discord.js"
import { logger } from "logger"

export class BotBaseError extends Error {
  constructor(message?: Message) {
    super()
    this.name = "Something went wrong"
    if (message) {
      const channel = message.channel as TextChannel
      this.message = JSON.stringify({
        guild: message.guild.name,
        channel: channel?.name,
        user: message.author.tag,
      })
    }
  }

  handle() {
    logger.error(this)
  }
}
