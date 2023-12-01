import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"
import { msgColors } from "utils/common"

export class APIError extends BotBaseError {
  specificError: string | null
  curl = "None"
  status: number

  constructor({
    msgOrInteraction,
    description,
    curl,
    status,
    error,
  }: {
    msgOrInteraction?: OriginalMessage
    description: string
    curl: string
    status: number
    error: string | null
  }) {
    super(msgOrInteraction, description)
    this.name = "API error"
    this.curl = curl
    this.status = status
    this.specificError = error
  }

  handle() {
    if (this.status === 500) {
      return
    }

    if (this.specificError) {
      this.reply?.({
        embeds: [
          getErrorEmbed({
            description: this.specificError,
          }),
        ],
      })
      return
    }

    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: "Internal Error",
          description: ["Something went wrong. We are fixing it."].join("\n"),
          color: msgColors.ERROR,
        }),
      ],
    })
  }
}
