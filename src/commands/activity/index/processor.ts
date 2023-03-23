import profile from "adapters/profile"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ActionTypeToEmoji, PlatformTypeToEmoji } from "utils/activity"
import { MessageEmbed } from "discord.js"
import { GetDateComponents } from "utils/time"

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

  const total = pagination?.total ?? 1
  const totalPages = Math.ceil(total / 12)
  const activityList = []
  const blank = getEmoji("BLANK")
  for (let i = 0; i < data.length; i++) {
    const activity = data[i]
    const actionEmoji = ActionTypeToEmoji(activity.action)
    const platformEmoji = PlatformTypeToEmoji(activity.platform)
    const date = new Date(activity.created_at)
    const { monthName, hour, minute, time, day } = GetDateComponents(date)
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
  const { hour, minute, time, day, month, year } = GetDateComponents(new Date())
  const dateNow = `${day}/${month}/${year} ${hour}:${minute} ${time}`
  for (let i = 0; i < activityList.length; i++) {
    const { dateTime, actionAndRewardRow, activityPlatform } = activityList[i]
    description =
      description +
      `[[${dateTime}]](https://mochi.gg/) \`${activityPlatform}\` ・ ${actionAndRewardRow}\n`
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
