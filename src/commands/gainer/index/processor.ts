import defi from "adapters/defi"
import {
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  TokenEmojiKey,
} from "utils/common"
import { InternalError } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
  CommandInteraction,
  SelectMenuInteraction,
  MessageSelectMenu,
} from "discord.js"
import { formatDigit } from "utils/defi"

export enum TimeRange {
  H1 = "1h",
  D1 = "24h",
  W1 = "7d",
  Y1 = "1y",
}

export enum Tab {
  Gainer = "gainer",
  Loser = "loser",
}

const timeRangePropertyMap = {
  [TimeRange.H1]: "usd_1h_change",
  [TimeRange.D1]: "usd_24h_change",
  [TimeRange.W1]: "usd_7d_change",
  [TimeRange.Y1]: "usd_1y_change",
}

function compose(
  data: {
    name: string
    symbol: string
    usd: number
    usd_1h_change: number
    usd_24h_change: number
    usd_7d_change: number
    usd_1y_change: number
  }[],
  tab: Tab,
  timeRange: TimeRange
) {
  const embed = composeEmbedMessage(null, {
    author: [
      `Top ${tab}s`,
      getEmojiURL(
        tab === Tab.Gainer
          ? emojis.ANIMATED_ARROW_UP
          : emojis.ANIMATED_ARROW_DOWN
      ),
    ],
    description: [
      `${getEmoji("CHART")} **Viewing in ${timeRange} time**\n`,
      formatDataTable(data, {
        cols: ["name", "symbol", "usd", timeRangePropertyMap[timeRange] as any],
        rowAfterFormatter: (f, i) =>
          `${getEmojiToken(data[i].symbol as TokenEmojiKey)}${f}`,
      }).joined,
    ].join("\n"),
  })

  return embed
}

function getTimeRangeSelect(currentTimeRange: TimeRange) {
  return new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setPlaceholder("📅 Choose time")
      .setCustomId("change_time")
      .addOptions(
        Object.entries(TimeRange)
          .filter((e: any) => e[1] !== currentTimeRange)
          .map((t) => ({
            label: `📅 ${t[0]}`,
            value: t[0],
          }))
      )
  )
}

function getGainerLoserTab(tab: Tab) {
  return new MessageActionRow().addComponents(
    new MessageButton({
      style: "SECONDARY",
      emoji: getEmoji("ANIMATED_ARROW_UP", true),
      label: "Gainer",
      customId: "view_gainer",
      disabled: tab === Tab.Gainer,
    }),
    new MessageButton({
      style: "SECONDARY",
      emoji: getEmoji("ANIMATED_ARROW_DOWN", true),
      label: "Loser",
      customId: "view_loser",
      disabled: tab === Tab.Loser,
    })
  )
}

export async function render(
  interaction: CommandInteraction | SelectMenuInteraction | ButtonInteraction,
  tab: Tab,
  timeRange: TimeRange = TimeRange.H1
) {
  let data = []
  const {
    data: gainerLosers,
    ok,
    error,
  } = await defi.getTopGainerLoser({
    duration: `${timeRange}`,
  })
  if (ok) {
    if (tab === Tab.Gainer) {
      data = gainerLosers.top_gainers
    } else {
      data = gainerLosers.top_losers
    }
  }

  data = data.slice(0, 10)

  data = data.map((d: any) => ({
    ...d,
    symbol: d.symbol.toUpperCase(),
    usd: `$${formatDigit({
      value: d.usd,
      fractionDigits: d.usd > 100 ? 0 : 2,
    })}`,
    usd_1h_change: `${formatDigit({
      value: d.usd_1h_change,
      fractionDigits: d.usd_1h_change > 10 ? 0 : 2,
    })}%`,
    usd_24h_change: `${formatDigit({
      value: d.usd_24h_change,
      fractionDigits: d.usd_24h_change > 10 ? 0 : 2,
    })}%`,
    usd_7d_change: `${formatDigit({
      value: d.usd_7d_change,
      fractionDigits: d.usd_7d_change > 10 ? 0 : 2,
    })}%`,
    usd_1y_change: `${formatDigit({
      value: d.usd_1y_change,
      fractionDigits: d.usd_1y_change > 10 ? 0 : 2,
    })}%`,
  }))

  if (!data.length) {
    throw new InternalError({
      msgOrInteraction: interaction,
      descriptions: ["Couldn't fetch data"],
      reason: error || "We're investigating",
    })
  }

  return {
    messageOptions: {
      embeds: [compose(data, tab, timeRange)],
      components: [getTimeRangeSelect(timeRange), getGainerLoserTab(tab)],
    },
  }
}
