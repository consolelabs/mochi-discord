import { getEmoji } from "utils/common"

export function PlatformTypeToEmoji(platformType: string) {
  switch (platformType) {
    case "Mochi Pay":
      return getEmoji("MOCHI_PAY")
    case "Mochi App":
      return getEmoji("MOCHI_APP")
    default:
      return getEmoji("MOCHI_APP")
  }
}

export function ActionTypeToEmoji(actionType: string) {
  switch (actionType) {
    case "tip":
      return getEmoji("ACTIVITY_CASH")
    case "withdraw":
      return getEmoji("ACTIVITY_COIN")
    case "deposit":
      return getEmoji("ACTIVITY_MONEY")
    case "gain_xp":
      return getEmoji("ACTIVITY_XP")
    case "gm":
      return getEmoji("ACTIVITY_HEART")
    case "quest":
      return getEmoji("QUEST")
    default:
      return getEmoji("QUEST")
  }
}

export function GetActivityContent(activityContent: string, params: string[]) {
  for (let i = 0; i < params.length; i++) {
    activityContent = activityContent.replace(`params`, params[i])
  }

  return activityContent
}
