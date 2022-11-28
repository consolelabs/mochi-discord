import { MessageOptions } from "discord.js"
import { BotBaseError, OriginalMessage } from "./BaseError"

export class CommandArgumentError extends BotBaseError {
  private getHelpMessage: () => Promise<MessageOptions>

  constructor({
    message,
    getHelpMessage,
    description,
  }: {
    message?: OriginalMessage
    getHelpMessage: () => Promise<MessageOptions>
    description?: string
  }) {
    super(message, description)
    this.name = "Command argument error"
    this.getHelpMessage = getHelpMessage
  }

  async handle() {
    const { embeds } = await this.getHelpMessage()

    // only reply if there is a help message of that command
    if ((embeds?.length ?? 0) > 0) {
      this.reply?.({
        content:
          "> It may be incorrect command, here's a help reference for you 👇",
        embeds,
      })
    }
  }
}
