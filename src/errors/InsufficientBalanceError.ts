import { Message, MessageEmbed, TextChannel } from "discord.js"
import { getEmbedFooter } from "utils/discord"
import { BotBaseError } from "./BaseError"

export class InsufficientBalanceError extends BotBaseError {
  private discordMessage: Message

  constructor({
    discordId,
    guildId,
    message,
  }: {
    discordId?: string
    guildId: string
    message: Message
  }) {
    super()
    this.name = "Insufficient balance"
    this.discordMessage = message
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
      data: { discordId, guildId },
    })
  }

  handle() {
    super.handle()
    const embed = new MessageEmbed()
      .setColor("#d91c22")
      .setTitle("Insufficient balance")
      .setDescription("Transaction failed.\nYour balance is not enough.")
      .setFooter(
        getEmbedFooter([`${this.discordMessage.author.tag}`]),
        this.discordMessage.author.avatarURL()
      )
    this.discordMessage.channel.send({ embeds: [embed] })
  }
}
