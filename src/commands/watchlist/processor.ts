import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import { InternalError } from "errors"
import { getSlashCommand } from "utils/commands"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"

export async function handleUpdateWlError(
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
  const color = msgColors.ACTIVITY
  let title = ""
  const emojiUrl = getEmojiURL(emojis.ANIMATED_COIN_1)
  switch (true) {
    case error.toLowerCase().startsWith("record not found"):
      title = `${symbol.toUpperCase()} ${
        isRemove ? `is not in your watchlist` : "hasn't been supported"
      }`
      description = isRemove
        ? `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Add it by using ${await getSlashCommand("watchlist add")}`
        : `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Please choose a token supported by [Coingecko](https://www.coingecko.com/)`
      break
    case error.toLowerCase().startsWith("conflict") && !isRemove:
      title = `${symbol.toUpperCase()} has already been added to your watchlist.`
      description = `View watchlist with ${await getSlashCommand(
        "wlv"
      )} (alias for ${await getSlashCommand("watchlist view")})`
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
