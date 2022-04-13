import { Message, TextChannel } from "discord.js"
import { BotBaseError } from "./BaseError"

export class CommandNotAllowedToRunError extends BotBaseError {
  constructor({ message, command }: { message: Message; command: string }) {
    super()
    this.name = "Command not allowed to run"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
      data: { command },
    })
  }
}
