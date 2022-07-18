import { Message, TextChannel } from "discord.js"
import { BotBaseError } from "./BaseError"

export class AssetNotFoundError extends BotBaseError {
  constructor({ message, assetName }: { message: Message; assetName: string }) {
    super()
    this.name = `Asset is not found (${assetName})`
    const channel = message.channel as TextChannel
    this.message = JSON.stringify({
      guild: message.guild.name,
      channel: channel.name,
      user: message.author.tag,
      data: { assetName },
    })
  }
}
