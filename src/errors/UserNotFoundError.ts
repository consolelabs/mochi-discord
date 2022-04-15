import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discord-embed"
import { BotBaseError } from "./BaseError"

export class UserNotFoundError extends BotBaseError {
  private discordMessage: Message

  constructor({
    address,
    discordId,
    guildId,
    message,
  }: {
    address?: string
    discordId?: string
    guildId?: string
    message: Message
  }) {
    super()
    this.name = "User not found"
    this.discordMessage = message
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild?.name,
      channel: channel.name,
      user: message.author.tag,
      data: { address, discordId, guildId },
    })
  }

  handle() {
    super.handle()
    this.discordMessage.channel.send({
      embeds: [
        getErrorEmbed({
          msg: this.discordMessage,
          title: "User not found",
          description: "The user is invalid or not a member",
        }),
      ],
    })
  }
}
