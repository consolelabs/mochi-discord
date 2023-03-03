import { Message, User } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, roundFloatNumber } from "utils/common"
import { BotBaseError, OriginalMessage } from "./base"

type InsufficientBalanceErrorParam = {
  current: number
  required: number
  symbol: string
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

  private composeInsufficientBalanceEmbed(
    current: number,
    required: number,
    symbol: string
  ) {
    const tokenEmoji = getEmoji(symbol)
    return composeEmbedMessage(null, {
      author: ["Insufficient balance", getEmojiURL(emojis.REVOKE)],
      description: `${this.author}, your balance is insufficient.\nYou can deposit more by using \`$deposit ${symbol}\``,
    }).addFields([
      {
        name: "Required amount",
        value: `${tokenEmoji} ${roundFloatNumber(required, 4)} ${symbol}`,
        inline: true,
      },
      {
        name: "Your balance",
        value: `${tokenEmoji} ${roundFloatNumber(current, 4)} ${symbol}`,
        inline: true,
      },
    ])
  }

  handle() {
    if (!this.params || !this.msgOrInteraction) {
      return
    }
    const embed = this.composeInsufficientBalanceEmbed(
      this.params.current,
      this.params.required,
      this.params.symbol
    )
    this.reply?.({ embeds: [embed] })
  }
}
