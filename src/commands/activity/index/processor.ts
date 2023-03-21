import profile from "adapters/profile"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ActionTypeToEmoji, PlatformTypeToEmoji } from "utils/activity"
import { MessageEmbed } from "discord.js"
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
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
          "POINTINGRIGHT"
        )} This user does not have any activities yet`,
        color: msgColors.ACTIVITY,
      }),
    }

  const { data, ok, curl, error, log, pagination } =
    await profile.getUserActivities(dataProfile.id, page)
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data.length)
    return {
      embed: composeEmbedMessage(null, {
        title: "No activities found",
        description: `${getEmoji(
          "POINTINGRIGHT"
        )} This user does not have any activities yet`,
        color: msgColors.ACTIVITY,
      }),
    }

  const activityList = []
  const blank = getEmoji("BLANK")
  for (let i = 0; i < data.length; i++) {
    const activity = data[i]
    const actionEmoji = ActionTypeToEmoji(activity.action)
    const platformEmoji = PlatformTypeToEmoji(activity.platform)
    const date = new Date(activity.created_at)

    const time = date.getHours() > 12 ? "pm" : "am"
    const hour = (
      "0" + `${date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}`
    ).slice(-2)
    const minute = ("0" + date.getMinutes()).slice(-2)
    const t = `${
      monthNames[date.getMonth()]
    } ${date.getDate()} ${hour}:${minute} ${time}`
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
    activityList.push({
      dateTime: t,
      activityPlatform: activity.platform,
      platformEmoji,
      actionAndRewardRow,
    })
  }

  let description = ""
  for (let i = 0; i < activityList.length; i++) {
    const { dateTime, actionAndRewardRow, activityPlatform } = activityList[i]
    description =
      description +
      `[[${dateTime}]](https://mochi.gg/) \`${activityPlatform}\`${blank.repeat(
        12
      )}\n${actionAndRewardRow}\n\n`
  }
  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("ACTIVITY_CLOCK")} Activity`)
    .setDescription(description)
    .setColor(msgColors.ACTIVITY)
    .setFooter({ text: "Mochi Bot" })
    .setTimestamp(Date.now())

  return {
    embed,
    totalPages: pagination?.total,
  }
}
