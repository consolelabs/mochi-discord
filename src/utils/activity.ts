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

const activityContent = [
  // TODO(trkhoi): add more activity content here
  {
    action: "tip",
    number_of_params: 3,
    activity_content: "Tipped params params params",
  },
]

export function GetActivityContent(action: string, params: string[]) {
  const activity = activityContent.find((a) => a.action === action)

  if (!activity) return ""

  let content = activity.activity_content

  for (let i = 0; i < activity.number_of_params; i++) {
    content = content.replace(`params`, params[i])
  }

  return content
}
