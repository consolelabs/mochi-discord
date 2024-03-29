import { InternalError, OriginalMessage } from "errors"
import { parseDiscordToken } from "./commands"
import { getEmoji } from "./common"

export function throwOnInvalidEmoji(emoji: string, msg: OriginalMessage) {
  const { isEmoji, isNativeEmoji, isAnimatedEmoji, value } =
    parseDiscordToken(emoji)

  let isValidEmoji = false
  msg.guild?.emojis.cache?.forEach((e) => {
    if (e.id) {
      if (value === e.id) {
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
      msgOrInteraction: msg,
      title: "Unsupported emojis",
      description: `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} Please use an emoji from this server or in the Discord default list.`,
    })
  }
}
