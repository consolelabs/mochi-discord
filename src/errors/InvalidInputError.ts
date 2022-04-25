import { Message, TextChannel } from "discord.js"
import { getInvalidInputEmbed } from "utils/discord-embed"
import { BotBaseError } from "./BaseError"

export class InvalidInputError extends BotBaseError {
  private discordMessage: Message
  constructor({ message }: { message: Message }) {
    super()
    this.discordMessage = message
    this.name = "Invalid input error"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
    })
  }

  async handle() {
    super.handle()
    await this.discordMessage.reply({
      embeds: [getInvalidInputEmbed(this.discordMessage)],
    })
  }
}
