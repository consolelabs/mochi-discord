import profile from "adapters/profile"
import { getEmoji, msgColors } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"

export async function handle(authorId: string, guildId: string) {
  const res = await profile.getUserGmStreak(authorId, guildId)
  if (!res.ok) {
    switch (res.error) {
      case "user has no gm streak":
        return null
      default:
        throw new Error(res.error)
    }
  }

  const daysCheckedIcons = new Array(res.data.streak_count)
    .fill(getEmoji("APPROVE"))
    .join("")
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("GM")} GM/GN streak`,
          description: `GM streak: **${res.data.streak_count}**\n${daysCheckedIcons}`,
          color: msgColors.PRIMARY,
        }),
      ],
    },
  }
}
