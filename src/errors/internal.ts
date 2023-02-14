import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"

export class InternalError extends BotBaseError {
  private _customDescription: string | undefined
  private emojiUrl: string | undefined

  public get customDescription(): string {
    return this._customDescription ?? "Something went wrong"
  }

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
    this._customDescription = description
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
