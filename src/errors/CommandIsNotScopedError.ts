import { BotBaseError, OriginalMessage } from "./BaseError"

export class CommandIsNotScopedError extends BotBaseError {
  constructor({
    message,
    category,
    command,
  }: {
    message: OriginalMessage
    category: string
    command: string
  }) {
    super(message)
    this.name = "Command is not scoped"
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { category, command },
    })
  }
}
