import { MessageActionRow, MessageButton, User } from "discord.js"
import { EmojiKey, getEmoji } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import ecocal from "adapters/ecocal"
import { getSlashCommand } from "utils/commands"
import { ResponseGetEcocalResponse } from "types/api"
import { VERTICAL_BAR, DOT } from "utils/constants"
import { getStartEndDate } from "utils/time"
import { paginationButtons } from "utils/router"

export async function composeEcocal(
  author: User,
  page = 0,
  user: User = author
) {

  const now = new Date()
  now.setDate(now.getDate() + page)
  const year = now.getFullYear();
  const month = now.toLocaleString('default', { month: 'short' });
  const day = now.getDate();

  const formattedDate = `${year} ${month} ${day}`;

  const impact = "1|2|3|Holiday"

  const { startDate, endDate } = getStartEndDate(now)

  const data = await ecocal.getEcocal(
    impact,
    startDate.toISOString(),
    endDate.toISOString()
  )

  const embed = composeEmbedMessage(null, {})

  if (!data?.length) {
    embed.setDescription(
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} No economic event in this day.`
    )
    return {
      msgOpts: {
        embeds: [embed],
      },
    }
  }

  const files: any[] = []

  const ecocalData = (data as ResponseGetEcocalResponse["data"]) ?? []

  const { segments } = formatDataTable(
    ecocalData.map((t) => {
      const eventTime = new Date(t.time ?? "")
      const formattedTime = eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


      const impact = t.impact ?? "";
      var impactSign = "🔵"
      switch (impact) {
        case "1":
          impactSign = "🔵"
          break;
        case "2":
          impactSign = "🔶"
          break;
        case "3":
          impactSign = "🔴"
      }

      const actual = t.actual?.trim() !== "" ? t.actual : "N/A";
      const forecast = t.forecast?.trim() !== "" ? t.forecast : "-";
      const previous = t.previous?.trim() !== "" ? t.previous : "N/A";


      return {
        eventTime: formattedTime,
        impactSign: impactSign,
        event_name: t.event_name ?? "",
        currency: (t.currency ?? "").toUpperCase(),
        actual: "A: " + actual ?? "",
        previous: "P: " + previous ?? "",
        forecast: "F: " + forecast ?? "",
      };
    }),
    {
      cols: ["impactSign", "actual", "previous", "forecast"],
      separator: [" ", VERTICAL_BAR, VERTICAL_BAR],
      rowAfterFormatter: (f, i) => {
        return `${f}`
      },
    }
  )

  const embedFields = ecocalData.map((t, i) => {
    const eventTime = new Date(t.time ?? "")
    const formattedTime = eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const val = `${getEmoji((t.currency ?? "") as EmojiKey)} ${formattedTime} ${DOT} [**${t.event_name}**](${t.url})
      \`\`${segments[0][i]}\`\`
    `

    return {
      name: ` `,
      value: val,
      inline: false,
    };
  })

  embed.setDescription(
    `**${getEmoji(
      "CHART"
    )} ECONOMIC CALENDAR - *${formattedDate}***\n`
  )
  embed.addFields(embedFields)

  return {
    context: {
      page,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        ...paginationButtons(page, 30),
      ],
      files,
    },
  }
}
