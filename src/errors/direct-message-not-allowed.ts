import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"

export class DirectMessageNotAllowedError extends BotBaseError {
  constructor({ message }: { message: OriginalMessage }) {
    super(message)
    this.name = "DM not enabled"
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: "DM not enabled",
          description: `<@!${this.userId}>, I could not send you a direct message.\nPlease make sure that you have enabled \`Allow direct messages from server members\` in User Settings.`,
          image: "https://i.imgur.com/ctGqgyf.png",
        }),
      ],
    })
  }
}
