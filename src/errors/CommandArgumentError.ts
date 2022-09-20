import { Guild, Message, MessageOptions, TextChannel, User } from "discord.js"
import { BotBaseError } from "./BaseError"

export class CommandArgumentError extends BotBaseError {
  private getHelpMessage: () => Promise<MessageOptions>

  constructor({
    message,
    getHelpMessage,
    user,
    guild,
    description,
  }: {
    message?: Message
    getHelpMessage: () => Promise<MessageOptions>
    user?: User
    guild?: Guild | null
    description?: string
  }) {
    super(message)
    this.name = "Command argument error"
    this.getHelpMessage = getHelpMessage
    const channel = (message?.channel as TextChannel)?.name
    this.message = JSON.stringify({
      guild: message?.guild?.name ?? guild?.name ?? "DM",
      channel,
      user: message?.author.tag ?? user?.tag ?? "Unknown",
      description,
    })
  }

  async handle() {
    const { embeds } = await this.getHelpMessage()

    // only reply if there is a help message of that command
    if ((embeds?.length ?? 0) > 0) {
      this.msgOrInteraction?.reply({
        content:
          "> It may be incorrect command, here's a help reference for you 👇",
        embeds,
      })
    }
  }
}
