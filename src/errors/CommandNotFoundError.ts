import { Message, TextChannel } from "discord.js"
import { BotBaseError } from "./BaseError"

export class CommandNotFoundError extends BotBaseError {
  constructor({ message, command }: { message: Message; command: string }) {
    super()
    this.name = "Command not found"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild?.name,
      channel: channel.name,
      user: message.author.tag,
      data: { command },
    })
  }
}
