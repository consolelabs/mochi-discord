import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discord-embed"
import { BotBaseError } from "./BaseError"

export class DiscordWalletTransferError extends BotBaseError {
  private discordMessage: Message
  private errorMsg: string

  constructor({
    discordId,
    guildId,
    message,
    errorMsg
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
      data: { discordId, guildId }
    })
  }

  handle() {
    super.handle()
    this.discordMessage.channel.send({
      embeds: [
        getErrorEmbed({
          msg: this.discordMessage,
          title: "Transaction error",
          description: this.errorMsg
        })
      ]
    })
  }
}
