import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class APIError extends BotBaseError {
  constructor({
    message,
    description,
  }: {
    message: Message
    description?: string | Record<string, string>
  }) {
    super(message)
    this.name = "API error"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild?.name,
      channel: channel.name,
      user: message.author.tag,
      log: description,
    })
  }

  handle() {
    this.msgOrInteraction?.reply({
      embeds: [
        getErrorEmbed({
          title: this.name,
          description:
            "There was something wrong with the API, please contact the admins",
        }),
      ],
    })
  }
}
