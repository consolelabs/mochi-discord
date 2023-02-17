import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from "discord.js"
import { InternalError } from "errors"
import { getEmoji } from "utils/common"

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
      message: msg,
      description,
    })
  }
  switch (true) {
    case error.toLowerCase().startsWith("record not found"):
      description = `**${symbol.toUpperCase()}** ${
        isRemove
          ? "didn't exist in your watchlist. Add new one by `$wl add <symbol>`"
          : "hasn't been supported"
      }.\n${getEmoji(
        "POINTING_RIGHT"
      )} Please choose a token supported by [Coingecko](https://www.coingecko.com/)`
      break
    case error.toLowerCase().startsWith("conflict") && !isRemove:
      description = `**${symbol.toUpperCase()}** has already been added to your watchlist.\n${getEmoji(
        "POINTING_RIGHT"
      )} Please choose another one listed on [CoinGecko](https://www.coingecko.com).`
      break
    default:
      break
  }
  throw new InternalError({
    message: msg,
    title: "Command Error",
    description,
  })
}
