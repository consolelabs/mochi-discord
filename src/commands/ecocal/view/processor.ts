import ecocal from "adapters/ecocal"
import { MessageActionRow, MessageButton, User } from "discord.js"
import { EmojiKey, getEmoji } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { ResponseGetEcocalResponse } from "types/common"
import { VERTICAL_BAR, DOT, SPACE } from "utils/constants"
import moment from "moment-timezone"

export function buildSwitchViewActionRow(selectedDate: Date) {
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
    disabled: moment(selectedDate).isSame(new Date(), "day"),
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

export function buildImpactFilterActionRow(selectedImpact: string) {
  const allImpactFilterButton = new MessageButton({
    label: "A",
    emoji: getEmoji("CHART"),
    customId: "all_impact",
    style: "SECONDARY",
    disabled: selectedImpact === "1|2|3|Holiday",
  })
  const lowImpactFilterButton = new MessageButton({
    label: "L",
    emoji: getEmoji("MEDIUM_BLUE_DIAMOND"),
    customId: "low_impact",
    style: "SECONDARY",
    disabled: selectedImpact === "1",
  })

  const mediumFilterButton = new MessageButton({
    label: "M",
    emoji: getEmoji("MEDIUM_ORANGE_DIAMOND"),
    customId: "medium_impact",
    style: "SECONDARY",
    disabled: selectedImpact === "2",
  })

  const highImpactFilterButton = new MessageButton({
    label: "H",
    emoji: getEmoji("MEDIUM_RED_TRIANGLE"),
    customId: "high_impact",
    style: "SECONDARY",
    disabled: selectedImpact === "3",
  })

  const row = new MessageActionRow()
  row.addComponents([
    allImpactFilterButton,
    lowImpactFilterButton,
    mediumFilterButton,
    highImpactFilterButton,
  ])

  return row
}

export async function composeEcocal(
  author: User,
  dateNumber = 0,
  impact: string,
) {
  const now = new Date()
  now.setDate(now.getDate() + dateNumber)

  const startDate = moment(now).tz("Asia/Ho_Chi_Minh").startOf("day")
  const endDate = moment(now).tz("Asia/Ho_Chi_Minh").endOf("day")

  const formattedDate = startDate.unix()

  const utcStartDate = startDate.utc()
  const utcEndDate = endDate.utc()

  const data = await ecocal.getEcocal(
    impact,
    utcStartDate.toISOString(),
    utcEndDate.toISOString(),
  )

  const embed = composeEmbedMessage(null, {})

  if (!data?.length) {
    embed.setDescription(
      `**${getEmoji(
        "CALENDAR",
      )}️ ECONOMIC CALENDAR - *<t:${formattedDate}:D>***\n\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} There is no Economic Event in this day.`,
    )
    return {
      msgOpts: {
        embeds: [embed],
        components: [buildSwitchViewActionRow(now)],
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
    },
  )

  const embedFields = ecocalData.map((t, i) => {
    const eventTime = moment(t.time).unix()
    const val = `${getEmoji(
      (t.country_name ?? "") as EmojiKey,
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
      "CALENDAR",
    )}️️ ECONOMIC CALENDAR - *<t:${formattedDate}:D>***\n\n${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true,
    )} *Indicators in real-time as economic events are announced and see the immediate global market impact.*\n`,
  )
  embed.setFields(embedFields)

  return {
    context: {
      dateNumber,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        buildImpactFilterActionRow(impact),
        buildSwitchViewActionRow(now),
      ],
    },
  }
}
