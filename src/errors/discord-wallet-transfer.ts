import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"

export class DiscordWalletTransferError extends BotBaseError {
  private error: string
  private title: string

  constructor({
    discordId,
    message,
    error,
    title,
  }: {
    discordId?: string
    message: OriginalMessage
    error?: string
    title?: string
  }) {
    super(message)
    this.name = "Discord wallet transfer error"
    this.error = error ?? "Something went wrong"
    this.title = title ?? "Transaction error"
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
          title: this.title,
          description: this.error,
        }),
      ],
      components: [],
    })
  }
}
