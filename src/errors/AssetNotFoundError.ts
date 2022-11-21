import { BotBaseError, OriginalMessage } from "./BaseError"

export class AssetNotFoundError extends BotBaseError {
  constructor({
    message,
    assetName,
  }: {
    message: OriginalMessage
    assetName: string
  }) {
    super(message)
    this.name = `Asset is not found (${assetName})`
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { assetName },
    })
  }
}
