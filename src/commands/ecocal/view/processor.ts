import ecocal from "adapters/ecocal"
import { MessageActionRow, MessageButton, User } from "discord.js"
import { EmojiKey, getEmoji } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { ResponseGetEcocalResponse } from "types/common"
import { VERTICAL_BAR, DOT, SPACE } from "utils/constants"
import moment from "moment-timezone"

export function buildSwitchViewActionRow() {
  const prevDateButton = new MessageButton({
    label: "",
    emoji: getEmoji("LEFT_ARROW"),
    customId: "prev_date",
    style: "SECONDARY",
  })
  const todayButton = new MessageButton({
    label: "Today ",
    emoji: getEmoji("CALENDAR_NUMBER"),
    customId: "today",
    style: "SECONDARY",
  })
  const nextDateButton = new MessageButton({
    label: "",
    emoji: getEmoji("RIGHT_ARROW"),
    customId: "next_date",
    style: "SECONDARY",
  })
  const row = new MessageActionRow()
  row.addComponents([prevDateButton, todayButton, nextDateButton])
  return row
}

export async function composeEcocal(author: User, dateNumber = 0) {
  const now = new Date()
  now.setDate(now.getDate() + dateNumber)

  const startDate = moment(now).tz("Asia/Ho_Chi_Minh").startOf("day")
  const endDate = moment(now).tz("Asia/Ho_Chi_Minh").endOf("day")

  const formattedDate = startDate.unix()

  const utcStartDate = startDate.utc()
  const utcEndDate = endDate.utc()

  const impact = "1|2|3|Holiday"
  const data = await ecocal.getEcocal(
    impact,
    utcStartDate.toISOString(),
    utcEndDate.toISOString()
  )

  const embed = composeEmbedMessage(null, {})

  if (!data?.length) {
    embed.setDescription(
      `**${getEmoji(
        "CALENDAR"
      )}️ ECONOMIC CALENDAR - *<:t${formattedDate}:D>***\n\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} No Economic event in this day.`
    )
    return {
      msgOpts: {
        embeds: [embed],
      },
    }
  }

  const ecocalData = (data as ResponseGetEcocalResponse["data"]) ?? []
  const { segments } = formatDataTable(
    ecocalData.map((t) => {
      const actual = t.actual?.trim() !== "" ? t.actual : "N/A"
      const forecast = t.forecast?.trim() !== "" ? t.forecast : "N/A"
      const previous = t.previous?.trim() !== "" ? t.previous : "N/A"

      return {
        event_name: t.event_name ?? "",
        currency: (t.currency ?? "").toUpperCase(),
        actual: "A: " + actual ?? "",
        previous: "P: " + previous ?? "",
        forecast: "F: " + forecast ?? "",
      }
    }),
    {
      cols: ["actual", "previous", "forecast"],
      separator: [VERTICAL_BAR, VERTICAL_BAR, VERTICAL_BAR],
      rowAfterFormatter: (f, i) => {
        const impact = ecocalData[i].impact ?? ""
        let impactSign = getEmoji("MEDIUM_BLUE_DIAMOND")
        switch (impact) {
          case "1":
            impactSign = getEmoji("MEDIUM_BLUE_DIAMOND")
            break
          case "2":
            impactSign = getEmoji("MEDIUM_ORANGE_DIAMOND")
            break
          case "3":
            impactSign = getEmoji("MEDIUM_RED_TRIANGLE")
        }
        return `${impactSign} ${f}`
      },
    }
  )

  const embedFields = ecocalData.map((t, i) => {
    const eventTime = moment(t.time).unix()
    const val = `${getEmoji(
      (t.country_name ?? "") as EmojiKey
    )} [<t:${eventTime}:t> ${DOT} **${t.event_name}**](${t.url})\n${
      segments[0][i]
    }\n
    `

    return {
      name: SPACE,
      value: val,
      inline: false,
    }
  })

  embed.setDescription(
    `**${getEmoji(
      "CALENDAR"
    )}️️ ECONOMIC CALENDAR - *<t:${formattedDate}:D>***\n\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} *Indicators in real-time as economic events are announced and see the immediate global market impact.*\n`
  )
  embed.setFields(embedFields)

  return {
    context: {
      dateNumber,
    },
    msgOpts: {
      embeds: [embed],
      components: [buildSwitchViewActionRow()],
    },
  }
}
