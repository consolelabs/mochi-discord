import { getEmoji } from "utils/common"

export function PlatformTypeToEmoji(platformType: string) {
  switch (platformType) {
    case "Mochi Pay":
      return getEmoji("MOCHI_PAY", true)
    case "Mochi App":
      return getEmoji("MOCHI_APP", true)
    default:
      return getEmoji("MOCHI_APP", true)
  }
}

export function ActionTypeToEmoji(actionType: string) {
  switch (actionType) {
    case "tip":
      return getEmoji("ACTIVITY_CASH", true)
    case "withdraw":
      return getEmoji("ACTIVITY_COIN", true)
    case "deposit":
      return getEmoji("ACTIVITY_MONEY", true)
    case "gain_xp":
      return getEmoji("ACTIVITY_XP", true)
    case "gm":
      return getEmoji("ACTIVITY_HEART", true)
    case "quest":
      return getEmoji("QUEST", true)
    default:
      return getEmoji("QUEST", true)
  }
}
