import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"

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

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          description: "Command is not in scope for this server",
        }),
      ],
    })
  }
}
