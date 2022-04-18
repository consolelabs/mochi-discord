import { Message, TextChannel } from "discord.js"
import { BotBaseError } from "./BaseError"
import { getErrorEmbed } from "utils/discord-embed"

export class UserNotVerifiedError extends BotBaseError {
  private discordMessage: Message

  constructor({ message, discordId }: { message: Message; discordId: string }) {
    super()
    this.discordMessage = message
    this.name = "User not verified"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
      data: { discordId },
    })
  }

  handle() {
    super.handle()
    this.discordMessage.channel.send({
      embeds: [
        getErrorEmbed({
          msg: this.discordMessage,
          title: "User not verified",
          description: "Cannot get user profile due to unverification",
        }),
      ],
    })
  }
}
