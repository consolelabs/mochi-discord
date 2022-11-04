import { CommandInteraction, Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError } from "./BaseError"

export class DirectMessageNotAllowedError extends BotBaseError {
  private discordMessage: Message

  constructor({ message }: { message: Message }) {
    super()
    this.discordMessage = message
    this.name = "DM not enabled"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild?.name,
      channel: channel.name,
      user: message.author.tag,
    })
  }

  handle() {
    super.handle()
    this.discordMessage.channel.send({
      embeds: [
        getErrorEmbed({
          msg: this.discordMessage,
          title: "DM not enabled",
          description: `<@!${this.discordMessage.author.id}>, could not send you a direct message.\nPlease make sure that you have enabled \`Allow direct messages from server members\` in User Settings.`,
          image: "https://i.imgur.com/ctGqgyf.png",
        }),
      ],
    })
  }
}

export class DirectMessageNotAllowedSlashError extends BotBaseError {
  private interaction: CommandInteraction

  constructor({ interaction }: { interaction: CommandInteraction }) {
    super()
    this.interaction = interaction
    this.name = "DM not enabled"
    const channel = interaction.channel as TextChannel
    this.message = JSON.stringify({
      guild: interaction.guild?.name,
      channel: channel.name,
      user: interaction.user.tag,
    })
  }

  handle() {
    super.handle()
    this.interaction.channel?.send({
      embeds: [
        getErrorEmbed({
          title: "DM not enabled",
          description: `<@!${this.interaction.user.id}>, could not send you a direct message.\nPlease make sure that you have enabled \`Allow direct messages from server members\` in User Settings.`,
          image: "https://i.imgur.com/ctGqgyf.png",
        }),
      ],
    })
  }
}
