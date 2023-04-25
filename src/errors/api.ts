import { getErrorEmbed } from "ui/discord/embed"
import { msgColors } from "utils/common"
import { BotBaseError, OriginalMessage } from "./base"

export class APIError extends BotBaseError {
  specificError: string | undefined
  curl = "None"

  constructor({
    msgOrInteraction,
    description,
    curl,
    error,
  }: {
    msgOrInteraction?: OriginalMessage
    description?: string
    curl: string
    error?: string
  }) {
    super(msgOrInteraction, description)
    this.name = "API error"
    this.curl = curl
    this.specificError = error
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          description: this.specificError,
          color: msgColors.ERROR,
        }),
      ],
    })
  }
}
