import { InternalError, OriginalMessage } from "errors"
import { parseDiscordToken } from "./commands"

export function throwOnInvalidEmoji(emoji: string, msg: OriginalMessage) {
  const { isEmoji, isNativeEmoji, isAnimatedEmoji, value } =
    parseDiscordToken(emoji)
  let isValidEmoji = false

  msg.guild?.emojis.cache?.forEach((e) => {
    if (e.name) {
      if (value.includes(e.name.toLowerCase())) {
        isValidEmoji = true
      }
    }
  })

  if (isNativeEmoji) {
    isValidEmoji = true
  } else {
    isValidEmoji = isValidEmoji && (isEmoji || isAnimatedEmoji)
  }

  if (!isValidEmoji) {
    throw new InternalError({
      message: msg,
      title: "Unsupported Emoji",
      description:
        "👉 Please use the **custom emoji/sticker from this server** and the **Discord default emoji/sticker**",
    })
  }
}
