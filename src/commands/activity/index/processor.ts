import profile from "adapters/profile"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ActionTypeToEmoji, PlatformTypeToEmoji } from "utils/activity"

export async function render(userDiscordId: string) {
  // const { dataProfile, okProfile, curlProfile, errorProfile, logProfile } =
  //   await profile.getByDiscord(userDiscordId)
  // console.log("check dataProfile: ", dataProfile)
  // if (!okProfile) {
  //   throw new APIError({
  //     curl: curlProfile,
  //     error: errorProfile,
  //     description: logProfile,
  //   })
  // }
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
    timestampList.push({
      name: "",
      value: `${platformEmoji} \`${activity.platform}\`\n${activity.created_at}`,
      inline: true,
    })
    actionList.push({
      name: "",
      value: `${actionEmoji} ${activity.action_description.description}`,
      inline: true,
    })
    rewardList.push({
      name: "",
      value: `${getEmoji("ACTIVITY_XP", true)} ${
        activity.action_description.reward
      }`,
      inline: true,
    })
  }
  console.log("check spit list", timestampList, actionList, rewardList)

  const res = []
  for (let i = 0; i < data.length; i++) {
    res.push(timestampList[i])
    res.push(actionList[i])
    res.push(rewardList[i])
  }

  console.log("check list reps", res)

  const fields = res.unshift(
    {
      name: "Timestamp",
      value: "\u200b",
      inline: true,
    },
    {
      name: "Action",
      value: "\u200b",
      inline: true,
    },
    {
      name: "Reward",
      value: "\u200b",
      inline: true,
    }
  )
  console.log("check fields", fields)

  return {
    messageOptions: {
      embeds: [
        {
          color: msgColors.BLUE,
          title: `${getEmoji("ACTIVITY_CLOCK")} Activity`,
          fields,
        },
      ],
    },
  }
}
