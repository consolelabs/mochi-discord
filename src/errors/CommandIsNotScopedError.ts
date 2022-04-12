import { Message, TextChannel } from "discord.js"
import { NekoBotBaseError } from "./BaseError"

export class CommandIsNotScopedError extends NekoBotBaseError {
  constructor({
    message,
    category,
    command,
  }: {
    message: Message
    category: string
    command: string
  }) {
    super()
    this.name = "Command is not scoped"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
      data: { category, command },
    })
  }
}
