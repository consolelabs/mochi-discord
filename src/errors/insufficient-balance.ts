import { Message, User } from "discord.js"
import { composeInsufficientBalanceEmbed } from "ui/discord/embed"
import { TokenEmojiKey } from "utils/common"
import { BotBaseError, OriginalMessage } from "./base"

type InsufficientBalanceErrorParam = {
  current?: number
  required?: number
  symbol: TokenEmojiKey
}

export class InsufficientBalanceError extends BotBaseError {
  private params: InsufficientBalanceErrorParam
  private author: User

  constructor({
    msgOrInteraction,
    params,
  }: {
    msgOrInteraction: OriginalMessage
    params: InsufficientBalanceErrorParam
  }) {
    super(msgOrInteraction)
    this.params = params
    this.name = "Insufficient funds error"
    this.author =
      msgOrInteraction instanceof Message
        ? msgOrInteraction.author
        : msgOrInteraction.user
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { discordId: this.author.id },
    })
  }

  handle() {
    if (!this.params || !this.msgOrInteraction) {
      return
    }
    const embed = composeInsufficientBalanceEmbed({
      ...this.params,
      author: this.author,
    })
    this.reply?.({ embeds: [embed], components: [] })
  }
}
