import { Message, MessageComponentInteraction, TextChannel } from "discord.js"
import { logger } from "logger"
import { getErrorEmbed } from "utils/discordEmbed"

// Base or "catch-all" error, do not throw this directly
export class BotBaseError extends Error {
  protected msgOrInteraction?: Message | MessageComponentInteraction

  constructor(
    message?: Message | MessageComponentInteraction,
    errorMessage?: string
  ) {
    super()
    this.name = "Something went wrong (unexpected error)"
    this.message = errorMessage ?? ""
    if (message) {
      this.msgOrInteraction = message
      const channel = message.channel as TextChannel
      const user = "author" in message ? message.author.tag : message.user.tag
      this.message = JSON.stringify({
        guild: message.guild?.name,
        channel: channel?.name,
        user,
      })
    }
  }

  handle() {
    logger.error(this)
    this.msgOrInteraction?.reply({
      embeds: [getErrorEmbed({})],
    })
  }
}
