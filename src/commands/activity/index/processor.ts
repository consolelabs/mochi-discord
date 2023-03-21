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

  const totalPages = pagination?.total ?? 1
  const activityList = []
  const blank = getEmoji("BLANK")
  for (let i = 0; i < data.length; i++) {
    const activity = data[i]
    const actionEmoji = ActionTypeToEmoji(activity.action)
    const platformEmoji = PlatformTypeToEmoji(activity.platform)
    const date = new Date(activity.created_at)
    const { monthName, hour, minute, time, day } = getDateComponents(date)
    const t = `${monthName} ${day} ${hour}:${minute} ${time.toLowerCase()}`
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
  const { hour, minute, time, day, month, year } = getDateComponents(new Date())
  const dateNow = `${day}/${month}/${year} ${hour}:${minute} ${time}`
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
    .setFooter({
      text: `Page ${page + 1}/${totalPages} • Mochi Bot • ${dateNow}`,
    })
  return {
    embed,
    totalPages,
  }
}

const getDateComponents = (d: Date) => {
  return {
    day: ("0" + `${d.getDate()}`).slice(-2),
    month: ("0" + `${d.getMonth() + 1}`).slice(-2),
    monthName: monthNames[d.getMonth()],
    year: d.getFullYear(),
    minute: ("0" + `${d.getMinutes()}`).slice(-2),
    time: d.getHours() > 12 ? "PM" : "AM",
    hour: (
      "0" + `${d.getHours() > 12 ? d.getHours() - 12 : d.getHours()}`
    ).slice(-2),
  }
}
