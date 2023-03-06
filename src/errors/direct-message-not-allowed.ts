import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"
import { getAuthor } from "utils/common"

export class DirectMessageNotAllowedError extends BotBaseError {
  private title: string
  private description: string

  constructor({
    message,
    title,
    description,
  }: {
    message: OriginalMessage
    title?: string
    description?: string
  }) {
    super(message)
    const author = getAuthor(message)
    this.title = title ?? "DM not enabled"
    this.description =
      description ??
      `${author}, I could not send you a direct message.\nPlease make sure that you have enabled \`Allow direct messages from server members\` in **User Settings**.`
    this.name = "DM not enabled"
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: this.title,
          description: this.description,
          image: "https://i.imgur.com/ctGqgyf.png",
        }),
      ],
    })
  }
}
