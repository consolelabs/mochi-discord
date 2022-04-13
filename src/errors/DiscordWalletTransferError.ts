import { Message, MessageEmbed, TextChannel } from "discord.js"
import { getEmbedFooter } from "utils/discord"
import { BotBaseError } from "./BaseError"

export class DiscordWalletTransferError extends BotBaseError {
  private discordMessage: Message
  private errorMsg: string

  constructor({
    discordId,
    guildId,
    message,
    errorMsg,
  }: {
    discordId?: string
    guildId: string
    message: Message
    errorMsg?: string
  }) {
    super()
    this.name = "Discord wallet transfer error"
    this.discordMessage = message
    this.errorMsg = errorMsg
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
      .setTitle("Transaction error")
      .setDescription(
        this.errorMsg
          ? this.errorMsg
          : "Something went wrong! Please try again or contact administrators"
      )
      .setFooter(
        getEmbedFooter([`${this.discordMessage.author.tag}`]),
        this.discordMessage.author.avatarURL()
      )
    this.discordMessage.channel.send({ embeds: [embed] })
  }
}
