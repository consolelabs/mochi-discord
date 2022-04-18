import { Message, MessageEmbed, TextChannel } from "discord.js"
import { getEmbedFooter } from "utils/common"
import { getErrorEmbed } from "utils/discord-embed"
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
    this.discordMessage.channel.send({
      embeds: [
        getErrorEmbed({
          msg: this.discordMessage,
          title: "Insufficient balance",
          description: "Transaction failed.\nYour balance is not enough.",
        }),
      ],
    })
  }
}
