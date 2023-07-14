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
import { formatPercentDigit, formatUsdDigit } from "utils/defi"

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
      `${getEmoji("CHART")} **Viewing in timeframe ${Object.entries(TimeRange)
        .find((e) => e[1] === timeRange)
        ?.at(0)}**\n`,
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
      .setPlaceholder("📅 Choose timeframe")
      .setCustomId("change_time")
      .addOptions(
        Object.entries(TimeRange).map((t) => ({
          label: `📅 ${t[0]}`,
          value: t[1],
          default: t[1] === currentTimeRange,
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
  timeRange: TimeRange = TimeRange.D1
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
    usd: `$${formatUsdDigit(d.usd)}`,
    usd_1h_change: `${formatPercentDigit(d.usd_1h_change)}%`,
    usd_24h_change: `${formatPercentDigit(d.usd_24h_change)}%`,
    usd_7d_change: `${formatPercentDigit(d.usd_7d_change)}%`,
    usd_1y_change: `${formatPercentDigit(d.usd_1y_change)}%`,
  }))

  if (!data.length) {
    throw new InternalError({
      msgOrInteraction: interaction,
      descriptions: ["Couldn't fetch data"],
      reason: error || "We're investigating",
    })
  }

  return {
    initial: tab,
    context: {
      timeRange,
    },
    msgOpts: {
      embeds: [compose(data, tab, timeRange)],
      components: [getTimeRangeSelect(timeRange), getGainerLoserTab(tab)],
    },
  }
}
