import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import { InternalError } from "errors"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"

export function handleUpdateWlError(
  msg: Message | MessageComponentInteraction | CommandInteraction | undefined,
  symbol: string,
  error: string | null,
  isRemove?: boolean
) {
  if (!msg) return
  let description = ""
  if (!error) {
    throw new InternalError({
      msgOrInteraction: msg,
      description,
    })
  }
  let color = msgColors.GRAY
  let title = ""
  let emojiUrl = ""
  switch (true) {
    case error.toLowerCase().startsWith("record not found"):
      description = `**${symbol.toUpperCase()}** ${
        isRemove
          ? "didn't exist in your watchlist. Add new one by `$wl add <symbol>`"
          : "hasn't been supported"
      }.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Please choose a token supported by [Coingecko](https://www.coingecko.com/)`
      break
    case error.toLowerCase().startsWith("conflict") && !isRemove:
      description = `**${symbol.toUpperCase()}** has already been added to your watchlist.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Please choose another one listed on [CoinGecko](https://www.coingecko.com).`
      color = msgColors.ACTIVITY
      title = "Token has already existed"
      emojiUrl = getEmojiURL(emojis.ANIMATED_COIN_1)
      break
    default:
      break
  }
  throw new InternalError({
    msgOrInteraction: msg,
    title,
    emojiUrl,
    description,
    color,
  })
}
