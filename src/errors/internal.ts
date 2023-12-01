import { ColorResolvable } from "discord.js"
import { errorEmbed, getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"
import { msgColors } from "../utils/common"

export class InternalError extends BotBaseError {
  private _customDescription: string | undefined
  private emojiUrl: string | undefined
  private color?: ColorResolvable

  private title: string
  private descriptions?: string[]
  private reason?: string
  private extra?: { emoji: string; label: string; text: string }[]

  public get customDescription(): string {
    return this._customDescription ?? "Something went wrong"
  }

  constructor({
    msgOrInteraction,
    description,
    title,
    emojiUrl,
    color,
    descriptions,
    extra,
    reason,
  }: {
    msgOrInteraction?: OriginalMessage
    /**
     * @deprecated This will soon be removed in favor of `reason` and `descriptions` (notice the s)
     * Please use those instead - tuanddd
     * */
    description?: string
    descriptions?: string[]
    reason?: string
    extra?: { emoji: string; label: string; text: string }[]
    title?: string
    emojiUrl?: string
    color?: ColorResolvable
  }) {
    super(msgOrInteraction, description)
    this.name = title ?? "Internal error"
    this.title = title ?? "Internal error"
    this._customDescription = description
    this.emojiUrl = emojiUrl
    this.color = color ?? msgColors.GRAY

    this.descriptions = descriptions
    this.reason = reason
    this.extra = extra
  }

  handle() {
    if (this.reason) {
      this.reply?.({
        embeds: [
          errorEmbed(
            this.title,
            this.descriptions ?? [],
            this.reason,
            this.extra,
          ),
        ],
        components: [],
        files: [],
      })
    } else {
      this.reply?.({
        embeds: [
          getErrorEmbed({
            title: this.title,
            description: this.customDescription,
            emojiUrl: this.emojiUrl,
            color: this.color,
          }),
        ],
        components: [],
        files: [],
      })
    }
  }
}
