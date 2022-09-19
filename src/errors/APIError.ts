import { Guild, Message, TextChannel, User } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class APIError extends BotBaseError {
  curl = "None"

  constructor({
    message,
    user,
    guild,
    description,
    curl,
  }: {
    message?: Message
    user?: User
    guild?: Guild | null
    description?: string | Record<string, string>
    curl: string
  }) {
    super(message)
    this.name = "API error"
    this.curl = curl
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
          title: this.name,
          description:
            "There was something wrong with the API, please contact the admins",
        }),
      ],
    })
  }
}
