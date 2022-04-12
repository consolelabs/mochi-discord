import { Message, MessageEmbed, TextChannel } from "discord.js"
import { getEmbedFooter } from "utils/discord"
import { NekoBotBaseError } from "./BaseError"

export class UserNotFoundError extends NekoBotBaseError {
  private discordMessage: Message

  constructor({
    address,
    discordId,
    guildId,
    message,
  }: {
    address?: string
    discordId?: string
    guildId: string
    message: Message
  }) {
    super()
    this.name = "User not found"
    this.discordMessage = message
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
      data: { address, discordId, guildId },
    })
  }

  handle() {
    super.handle()
    const embed = new MessageEmbed()
      .setColor("#d91c22")
      .setTitle("User not found")
      .setDescription("The user is invalid or not a Pod Town's member")
      .setFooter(
        getEmbedFooter([`${this.discordMessage.author.tag}`]),
        this.discordMessage.author.avatarURL()
      )
    this.discordMessage.channel.send({ embeds: [embed] })
  }
}
