import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError, OriginalMessage } from "./BaseError"

export class InternalError extends BotBaseError {
  private customDescription: string | undefined
  private emojiUrl: string | undefined

  constructor({
    message,
    description,
    title,
    emojiUrl,
  }: {
    message?: OriginalMessage
    description?: string
    title?: string
    emojiUrl?: string
  }) {
    super(message, description)
    this.name = title ?? "Internal error"
    this.customDescription = description
    this.emojiUrl = emojiUrl
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: this.name,
          description: this.customDescription,
          emojiUrl: this.emojiUrl,
        }),
      ],
    })
  }
}
