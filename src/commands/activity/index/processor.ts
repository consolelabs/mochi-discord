import profile from "adapters/profile"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ActionTypeToEmoji, PlatformTypeToEmoji } from "utils/activity"
import { MessageEmbed } from "discord.js"
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]
export async function render(userDiscordId: string) {
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }
  if (!dataProfile)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No activities found",
            description: `${getEmoji(
              "POINTINGRIGHT"
            )} This user does not have any activities yet`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  const { data, ok, curl, error, log } = await profile.getUserActivities(
    dataProfile.id
  )
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data.length)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No activities found",
            description: `${getEmoji(
              "POINTINGRIGHT"
            )} This user does not have any activities yet`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  const activityList = []
  for (let i = 0; i < data.length; i++) {
    const activity = data[i]
    const actionEmoji = ActionTypeToEmoji(activity.action)
    const platformEmoji = PlatformTypeToEmoji(activity.platform)
    const date = new Date(activity.created_at)

    const time = date.getHours() > 12 ? "pm" : "am"
    const hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
    const t = `${
      monthNames[date.getMonth()]
    } ${date.getDate()} ${hour}:${date.getMinutes()} ${time}`
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
    const actionAndRewardRow = `${actionEmoji} ${activity.action_description}`
    activityList.push({
      name: "\u200b",
      value: `[[${t}]](https://mochi.gg/) ${platformEmoji} \`${activity.platform}\`\n${actionAndRewardRow}`,
    })
  }

  const res = []
  for (let i = 0; i < data.length; i++) {
    res.push(activityList[i])
  }

  const fields = res

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("ACTIVITY_CLOCK")} Activity`)
    .setColor(msgColors.ACTIVITY)
    .setFooter({ text: "Mochi Bot" })
    .setTimestamp(Date.now())
  for (let i = 0; i < fields.length; i++) {
    embed.addFields(fields[i])
  }

  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}
