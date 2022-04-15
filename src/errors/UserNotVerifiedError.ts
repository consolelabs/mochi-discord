import { originalCommands } from "commands"
import { Message, MessageEmbed, TextChannel } from "discord.js"
import { getEmbedFooter } from "utils/discord"
import { BotBaseError } from "./BaseError"

export class UserNotVerifiedError extends BotBaseError {
  private discordMessage: Message
  private isAdmin: boolean

  constructor({ message, discordId }: { message: Message; discordId: string }) {
    super()
    this.isAdmin = discordId !== message.author.id
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
    const description = this.isAdmin
      ? "Cannot get user profile due to unverification"
      : `Cannot get user profile due to unverification`
    const embed = new MessageEmbed()
      .setColor("#d91c22")
      .setTitle("User not verified")
      .setDescription(description)
      .setFooter(
        getEmbedFooter([`${this.discordMessage.author.tag}`]),
        this.discordMessage.author.avatarURL()
      )
    this.discordMessage.channel.send({ embeds: [embed] })
  }
}
