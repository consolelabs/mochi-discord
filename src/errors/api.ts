import { ColorResolvable } from "discord.js"
import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"

export class APIError extends BotBaseError {
  specificError: string | undefined
  curl = "None"
  private color?: ColorResolvable

  constructor({
    msgOrInteraction,
    description,
    curl,
    error,
    color,
  }: {
    msgOrInteraction?: OriginalMessage
    description?: string
    curl: string
    error?: string
    color?: ColorResolvable
  }) {
    super(msgOrInteraction, description)
    this.name = "API error"
    this.curl = curl
    this.specificError = error
    this.color = color
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          description: this.specificError,
          color: this.color,
        }),
      ],
    })
  }
}
