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

  const timestampList = []
  const actionList = []
  const rewardList = []
  for (let i = 0; i < data.length; i++) {
    const activity = data[i]
    const actionEmoji = ActionTypeToEmoji(activity.action)
    const platformEmoji = PlatformTypeToEmoji(activity.platform)
    const date = new Date(activity.created_at)

    const time = date.getHours() > 12 ? "PM" : "AM"
    const hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
    const t = `${
      monthNames[date.getMonth()]
    } ${date.getDate()} ${hour}:${date.getMinutes()} ${time}`
    timestampList.push({
      name: "\u200b",
      value: `${platformEmoji} \`${activity.platform}\`\n${t}`,
      inline: true,
    })
    actionList.push({
      name: "\u200b",
      value: `${actionEmoji} ${activity.action_description.description}`,
      inline: true,
    })
    rewardList.push({
      name: "\u200b",
      value: `${getEmoji("ACTIVITY_XP")} ${activity.action_description.reward}`,
      inline: true,
    })
  }

  const res = []
  for (let i = 0; i < data.length; i++) {
    res.push(timestampList[i])
    res.push(actionList[i])
    res.push(rewardList[i])
  }

  res.unshift(
    {
      name: "\u200b",
      value: `**Timestamp**`,
      inline: true,
    },
    {
      name: "\u200b",
      value: `**Action**`,
      inline: true,
    },
    {
      name: "\u200b",
      value: `**Reward**`,
      inline: true,
    }
  )

  const fields = res

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("ACTIVITY_CLOCK")} Activity`)
    .setColor(msgColors.BLUE)
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
