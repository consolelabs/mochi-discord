import { getErrorEmbed } from "utils/discordEmbed"
import { BotBaseError, OriginalMessage } from "./BaseError"

export class DiscordWalletTransferError extends BotBaseError {
  private error: string

  constructor({
    discordId,
    message,
    error,
  }: {
    discordId?: string
    message: OriginalMessage
    error?: string
  }) {
    super(message)
    this.name = "Discord wallet transfer error"
    this.error = error ?? "Something went wrong"
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { discordId },
    })
  }

  handle() {
    this.reply?.({
      embeds: [
        getErrorEmbed({
          title: "Transaction error",
          description: this.error,
        }),
      ],
    })
  }
}
