import profile from "adapters/profile"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ActionTypeToEmoji, PlatformTypeToEmoji } from "utils/activity"
import { HORIZONTAL_BAR } from "utils/constants"

export async function render(userDiscordId: string, page: number) {
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }
  if (!dataProfile)
    return {
      embed: composeEmbedMessage(null, {
        title: "No activities found",
        description: `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} This user does not have any activities yet`,
        color: msgColors.ACTIVITY,
      }),
    }

  const { data, ok, curl, error, log, pagination } =
    await profile.getUserActivities(dataProfile.id, page, 7)
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data.length)
    return {
      embed: composeEmbedMessage(null, {
        title: "No activities found",
        description: `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} This user does not have any activities yet`,
        color: msgColors.ACTIVITY,
      }),
    }

  const total = pagination?.total ?? 1
  const totalPages = Math.ceil(total / 12)
  const activityList = []
  const blank = getEmoji("BLANK")
  let col2Len = 0
  for (let i = 0; i < data.length; i++) {
    const activity = data[i]
    const actionEmoji = ActionTypeToEmoji(activity.action)
    const platformEmoji = PlatformTypeToEmoji(activity.platform)
    // const xpReward = activity.action_description.reward
    //   ? `${getEmoji("ACTIVITY_XP")} + ${activity.action_description.reward}`
    //   : ""
    // const coinReward = activity.action_description.coin
    //   ? `${getEmoji("COIN2")} + ${activity.action_description.coin}`
    //   : ""
    // let rewardInfo = ""
    // if (xpReward || coinReward) {
    //   rewardInfo = `| ${xpReward} ${coinReward}`
    // }
    const actionAndRewardRow = `${actionEmoji} ${activity.action_description}${blank}`
    // const time = `${ms(Date.now() - new Date(activity.created_at).getTime(), {
    //   long: false,
    // })} ago`
    const time = Math.round(new Date(activity.created_at).getTime() / 1000)
    // col1Len = Math.max(col1Len, time.length)
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
    const { time, actionAndRewardRow, activityPlatform } = activityList[i]
    description =
      description +
      `\`${activityPlatform}${" ".repeat(
        col2Len - activityPlatform.length + 5
      )}\`<t:${time}:R>\n${HORIZONTAL_BAR} ${actionAndRewardRow}\n\n`
  }
  const embed = composeEmbedMessage(null, {
    author: ["Activity", getEmojiURL(emojis.CLOCK)],
    description,
    color: msgColors.ACTIVITY,
    footer: [`Page ${page + 1}/${totalPages}`],
  })
  // .setTitle(`${getEmoji("ACTIVITY_CLOCK")} Activity`)
  // .setDescription(description)
  // .setColor(msgColors.ACTIVITY)
  // .setFooter({
  //   text: `Page ${page + 1}/${totalPages} • Mochi Bot • ${dateNow}`,
  // })
  return {
    embed,
    totalPages,
  }
}
