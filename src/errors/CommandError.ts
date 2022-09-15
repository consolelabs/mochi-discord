import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class CommandError extends BotBaseError {
  private customDescription: string | undefined
  constructor({
    message,
    description,
  }: {
    message: Message
    description?: string
  }) {
    super(message)
    this.name = "Command error"
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
      embeds: [
        getErrorEmbed({
          title: this.name,
          description: this.customDescription,
        }),
      ],
    })
  }
}
