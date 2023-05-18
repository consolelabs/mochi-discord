import { ColorResolvable } from "discord.js"
import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"
import { msgColors } from "../utils/common"

export class InternalError extends BotBaseError {
  private _customDescription: string | undefined
  private emojiUrl: string | undefined
  private color?: ColorResolvable

  public get customDescription(): string {
    return this._customDescription ?? "Something went wrong"
  }

  constructor({
    msgOrInteraction,
    description,
    title,
    emojiUrl,
    color,
  }: {
    msgOrInteraction?: OriginalMessage
    description?: string
    title?: string
    emojiUrl?: string
    color?: ColorResolvable
  }) {
    super(msgOrInteraction, description)
    this.name = title ?? "Internal error"
    this._customDescription = description
    this.emojiUrl = emojiUrl
    this.color = color ?? msgColors.GRAY
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: this.name,
          description: this.customDescription,
          emojiUrl: this.emojiUrl,
          color: this.color,
        }),
      ],
    })
  }
}
