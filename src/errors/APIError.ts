import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class APIError extends BotBaseError {
  private customDescription: string | undefined
  constructor({
    message,
    description,
  }: {
    message: Message
    description?: string
  }) {
    super(message)
    this.name = "API error"
    this.customDescription = description
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild?.name,
      channel: channel.name,
      user: message.author.tag,
    })
  }

  handle() {
    this.msgOrInteraction?.reply({
      embeds: [getErrorEmbed({ description: this.customDescription })],
    })
  }
}
