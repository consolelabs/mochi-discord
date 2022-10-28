import { Guild, Message, TextChannel, User } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class APIError extends BotBaseError {
  specificError: string | undefined
  curl = "None"

  constructor({
    message,
    user,
    guild,
    description,
    curl,
    error,
  }: {
    message?: Message
    user?: User
    guild?: Guild | null
    description?: string | Record<string, string>
    curl: string
    error?: string
  }) {
    super(message)
    this.name = "API error"
    this.curl = curl
    this.specificError = error
    const channel = (message?.channel as TextChannel)?.name
    this.message = JSON.stringify({
      guild: message?.guild?.name ?? guild?.name ?? "DM",
      channel,
      user: message?.author.tag ?? user?.tag ?? "Unknown",
      log: description,
    })
  }

  handle() {
    this.msgOrInteraction?.reply({
      embeds: [
        getErrorEmbed({
          description: this.specificError,
        }),
      ],
    })
  }
}
