import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discord-embed"
import { BotBaseError } from "./BaseError"

export class TwitterHandleNotFoundError extends BotBaseError {
  private discordMessage: Message
  constructor({ message }: { message: Message }) {
    super()
    this.discordMessage = message
    this.name = "Missing twitter handle"
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
      embeds: [
        getErrorEmbed({
          msg: this.discordMessage,
          title: "Twitter handle missing",
          description: "Please specify a twitter handle e.g `$twitter your_handle`",
        }),
      ],
    })
  }
}
