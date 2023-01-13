import { getErrorEmbed } from "discord/embed/ui"
import { BotBaseError, OriginalMessage } from "./base"

export class GuildIdNotFoundError extends BotBaseError {
  private error: string

  constructor({ message }: { message?: OriginalMessage }) {
    super(message)
    this.name = "Guild ID not found"
    this.error =
      "User invoked a command that was likely in a DM because guild id can not be found"
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: "This command must be run in a guild",
          description: this.error,
        }),
      ],
    })
  }
}
