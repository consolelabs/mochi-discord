import { CommandInteraction, Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
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
    this.errorMsg = errorMsg ?? "Something went wrong"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild ? message.guild.name : "",
      channel: channel ? channel.name : "dm",
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
          title: "Transaction error",
          description: this.errorMsg,
        }),
      ],
    })
  }
}

export class DiscordWalletTransferSlashError extends BotBaseError {
  private interaction: CommandInteraction
  private errorMsg: string

  constructor({
    discordId,
    guildId,
    interaction,
    errorMsg,
  }: {
    discordId?: string
    guildId: string
    interaction: CommandInteraction
    errorMsg?: string
  }) {
    super()
    this.name = "Discord wallet transfer error"
    this.interaction = interaction
    this.errorMsg = errorMsg ?? "Something went wrong"
    const channel = interaction.channel as TextChannel
    this.message = JSON.stringify({
      guild: interaction.guild ? interaction.guild.name : "",
      channel: channel ? channel.name : "dm",
      user: interaction.user.tag,
      data: { discordId, guildId },
    })
  }

  handle() {
    super.handle()
    this.interaction.channel?.send({
      embeds: [
        getErrorEmbed({
          title: "Transaction error",
          description: this.errorMsg,
        }),
      ],
    })
  }
}
