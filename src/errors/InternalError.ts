import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError, OriginalMessage } from "./BaseError"

export class InternalError extends BotBaseError {
  private customDescription: string | undefined

  constructor({
    message,
    description,
  }: {
    message?: OriginalMessage
    description?: string
  }) {
    super(message, description)
    this.name = "Internal error"
    this.customDescription = description
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: this.name,
          description: this.customDescription,
        }),
      ],
    })
  }
}
