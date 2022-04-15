import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discord-embed"
import { BotBaseError } from "./BaseError"

export class DirectMessageNotAllowedError extends BotBaseError {
  private discordMessage: Message

  constructor({ message }: { message: Message }) {
    super()
    this.discordMessage = message
    this.name = "DM not enabled"
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
    })
  }

  handle() {
    super.handle()
    this.discordMessage.channel.send({
      content: `${this.discordMessage.author}`,
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
