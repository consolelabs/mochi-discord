import { getErrorEmbed } from "ui/discord/embed"
import { BotBaseError, OriginalMessage } from "./base"
import { getAuthor, getEmoji } from "../utils/common"

export class UnsupportedTokenError extends BotBaseError {
  private symbol: string

  constructor({
    msgOrInteraction,
    symbol,
  }: {
    msgOrInteraction: OriginalMessage
    symbol: string
  }) {
    super(msgOrInteraction)
    this.name = "Unsupported token error"
    const author = getAuthor(msgOrInteraction)
    this.symbol = symbol
    this.message = JSON.stringify({
      guild: this.guild,
      channel: this.channel,
      user: this.user,
      data: { discordId: author.id },
    })
  }

  handle() {
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    const errorEmbed = getErrorEmbed({
      title: "Unsupported token",
      description: `**${this.symbol}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
    this.reply?.({ embeds: [errorEmbed], components: [] })
  }
}
