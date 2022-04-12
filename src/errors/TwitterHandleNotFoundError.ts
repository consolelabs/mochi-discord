import { Message, TextChannel } from "discord.js"
import { getErrorEmbed } from "utils/discord"
import { NekoBotBaseError } from "./BaseError"

export class TwitterHandleNotFoundError extends NekoBotBaseError {
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
          title: "Twitter handle missing",
          message:
            "Please specify a twitter handle e.g `p!twitter your_handle`",
          discordMsg: this.discordMessage,
          avatarFooter: true,
        }),
      ],
    })
  }
}
