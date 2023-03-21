import profile from "adapters/profile"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ActionTypeToEmoji } from "utils/activity"
import { EmbedFieldData, MessageEmbed } from "discord.js"
import { logger } from "logger"
const monthNames = [
  "Jananuary",
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

  const now = new Date()
  const unreadList = data.filter((activity: any) => {
    return activity.status === "new"
  })
  const readList = data.filter((activity: any) => {
    const date = new Date(activity.created_at)
    return (
      activity.status === "read" &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear() &&
      date.getDate() === now.getDate()
    )
  })
  const unreadDescription = toDescriptionList(unreadList.slice(0, 5))
  const readDescription = toDescriptionList(readList.slice(0, 5))
  let line = ""
  for (let i = 0; i < 20; i++) {
    line += getEmoji("LINE")
  }
  const fields = [
    {
      name: `Unread \`${unreadList.length}\``,
      value: unreadDescription + `${line}`,
    },
    {
      name: `Read \`${readList.length}\``,
      value: readDescription,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: false,
  }))

  const embed = new MessageEmbed()
    .setTitle(`${getEmoji("MAIL")} Inbox`)
    .setColor(msgColors.ACTIVITY)
    .setFooter({ text: "Type /feedback to report • Mochi Bot" })
    .setTimestamp(Date.now())
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1085876941011304538/1087602219605573652/mail.png"
    )
    .addFields(fields)

  // mark read the inbox but ignore error
  const ids = unreadList.map((activity: any) => activity.id)
  await profile
    .markReadActivities(dataProfile.id, { ids: ids })
    .catch((error) => {
      logger.error("fail to mark read inbox", error)
    })

  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}

function toDescriptionList(list: []) {
  let description = ""
  list.map((element: any) => {
    const date = new Date(element.created_at)
    const time = date.getHours() > 12 ? "pm" : "am"
    const hour =
      (date.getHours() > 12 ? date.getHours() - 12 : date.getHours()) < 0
        ? `0${date.getHours()}`
        : date.getHours()
    const minute =
      date.getMinutes() < 0 ? `0${date.getMinutes()}` : date.getMinutes()
    const t = `${
      monthNames[date.getMonth()]
    } ${date.getDate()} ${hour}:${minute} ${time}`
    return (description += `${ActionTypeToEmoji(element.action)} ${
      element.action_description
    }\n${t}\n\n`)
  })
  if (list.length > 0) {
    description = description.slice(0, -1)
  }

  return description
}
