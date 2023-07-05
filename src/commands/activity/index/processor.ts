import profile from "adapters/profile"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ActionTypeToEmoji, PlatformTypeToEmoji } from "utils/activity"
import { paginationButtons } from "utils/router"

const pageSize = 7

export async function render(userDiscordId: string, page = 0) {
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }
  if (!dataProfile)
    return {
      msgOpts: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No activities found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} This user does not have any activities yet`,
            color: msgColors.ACTIVITY,
          }),
        ],
      },
    }

  const { data, pagination } = await profile.getUserActivities(
    dataProfile.id,
    page,
    pageSize
  )
  if (!data.length)
    return {
      msgOpts: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No activities found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} This user does not have any activities yet`,
            color: msgColors.ACTIVITY,
          }),
        ],
      },
    }

  const activityList = []
  const blank = getEmoji("BLANK")
  let col2Len = 0

  for (let i = 0; i < data.length; i++) {
    const activity = data[i]
    const actionEmoji = ActionTypeToEmoji(activity.action)
    const platformEmoji = PlatformTypeToEmoji(activity.platform)

    const actionAndRewardRow = `${actionEmoji} ${activity.action_description}${blank}`
    const time = new Date(activity.created_at).getTime() / 1000
    col2Len = Math.max(col2Len, activity.platform.length)

    activityList.push({
      time,
      activityPlatform: activity.platform,
      platformEmoji,
      actionAndRewardRow,
    })
  }

  let description = ""

  for (let i = 0; i < activityList.length; i++) {
    const { time, actionAndRewardRow } = activityList[i]

    description += `<t:${Math.floor(time)}:R> ${actionAndRewardRow}\n`
  }
  const totalPage = Math.ceil((pagination?.total ?? 0) / pageSize)

  const embed = composeEmbedMessage(null, {
    author: ["Activity", getEmojiURL(emojis.CLOCK)],
    description,
    color: msgColors.ACTIVITY,
    footer: [`Page ${page + 1}/${totalPage} • Mochi Bot • `],
  })

  return {
    context: {
      page,
    },
    msgOpts: {
      embeds: [embed],
      components: [...paginationButtons(page, totalPage)],
    },
  }
}
