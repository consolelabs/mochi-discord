import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"

export class APIError extends BotBaseError {
  specificError: string | undefined
  curl = "None"

  constructor({
    message,
    description,
    curl,
    error,
  }: {
    message?: OriginalMessage
    description?: string
    curl: string
    error?: string
  }) {
    super(message, description)
    this.name = "API error"
    this.curl = curl
    this.specificError = error
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          description: this.specificError,
        }),
      ],
    })
  }
}
