import community from "adapters/community"
import defi from "adapters/defi"
import { createCanvas, loadImage } from "canvas"
import { MessageAttachment } from "discord.js"
import { RectangleStats } from "types/canvas"
import { renderChartImage } from "ui/canvas/chart"
import { getChartColorConfig } from "ui/canvas/color"
import { drawRectangle } from "ui/canvas/draw"
import { getChance } from "utils/common"
import { ChartViewTimeOption } from "./processor"
import { time } from "cron"

export async function renderHistoricalMarketChart({
  coinId,
  days,
  discordId,
  isDominanceChart,
}: {
  coinId: string
  days: number
  discordId?: string
  isDominanceChart: boolean
}) {
  const currency = "usd"
  const { ok, data: historicalData } = await defi.getHistoricalMarketData({
    coinId,
    currency,
    days,
    discordId,
    isDominanceChart,
  })
  if (discordId) {
    community.updateQuestProgress({ userId: discordId, action: "ticker" })
  }
  if (!ok) return null
  const { times, prices, from, to } = historicalData
  const { data, labels } = customizeChart({ times, prices, days })

  // draw chart
  const chartLabel = `${
    isDominanceChart
      ? "Market cap percentage (%)"
      : `Price (${currency.toUpperCase()})`
  } | ${from} - ${to}`
  const chart = await renderChartImage({
    chartLabel,
    labels,
    data,
    colorConfig: getChartColorConfig(coinId),
  })
  if (!getChance(20)) return new MessageAttachment(chart, "chart.png")

  const container: RectangleStats = {
    x: { from: 0, to: 900 },
    y: { from: 0, to: 600 },
    w: 900,
    h: 600,
    radius: 0,
    bgColor: "rgba(0, 0, 0, 0)",
  }
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  drawRectangle(ctx, container, container.bgColor)
  // chart
  const chartImg = await loadImage(chart)
  ctx.drawImage(
    chartImg,
    container.x.from,
    container.y.from,
    container.w - 75,
    container.h,
  )

  // bull/bear
  const isAsc = prices[prices.length - 1] >= prices[0]
  const leftObj = await loadImage(
    `assets/images/${isAsc ? "blul" : "bera"}1.png`,
  )
  ctx.drawImage(leftObj, container.x.from, container.y.to - 230, 130, 230)
  const rightObj = await loadImage(
    `assets/images/${isAsc ? "blul" : "bera"}2.png`,
  )
  ctx.drawImage(rightObj, container.x.to - 130, container.y.to - 230, 130, 230)

  return new MessageAttachment(canvas.toBuffer(), "chart.png")
}

// customize chart data and labels if data time range >= 30d
// which results chart latest date with 3x normal range
// e.g. ticker chart 30d, 30 data points -> 29 lines
//      -> customizeChart() = 31 lines, last date takes 3 lines
function customizeChart({
  times,
  prices,
  days,
}: {
  times: string[]
  prices: number[]
  days: number
}) {
  if (days < 30 || prices.length < 30) {
    return { labels: times, data: prices }
  }

  // get last 3 unique dates
  const endDateIdx = times.length - 1
  const endDate = times[endDateIdx]
  const reversedTimes = Object.assign([], times).reverse()
  const startDate = reversedTimes.find((t) => t !== endDate)
  if (!startDate) {
    return { labels: times, data: prices }
  }
  const startDateIdx = times.indexOf(startDate)
  const nrOfInsertPts = Math.ceil(times.length * 0.05)
  const data: number[] | null[] = Object.assign([], prices)
  const labels = Object.assign([], times)
  Array(endDateIdx - startDateIdx + nrOfInsertPts)
    .fill(0)
    .forEach((_, idx) => {
      const insertIdx = startDateIdx + idx
      const isNewPoint = insertIdx + 1 >= endDateIdx
      data.splice(insertIdx + 1, isNewPoint ? 0 : 1, null)
      labels.splice(insertIdx + 1, isNewPoint ? 0 : 1, "")
    })

  return { data, labels }
}

export async function renderCompareTokenChart({
  baseId,
  targetId,
  chartLabel,
  guildId,
  days = ChartViewTimeOption.M1,
}: {
  baseId: string
  targetId: string
  chartLabel: string
  guildId: string
  days?: ChartViewTimeOption
}) {
  const { ok, data } = await defi.compareToken(
    guildId ?? "",
    baseId,
    targetId,
    days,
  )
  if (!ok) return { chart: null, ratio: 0 }
  const { times, ratios } = data
  if (!times || !times.length) return { chart: null, ratio: 0 }
  const image = await renderChartImage({
    chartLabel,
    labels: times,
    data: ratios,
  })

  return {
    chart: new MessageAttachment(image, "chart.png"),
    ratio: ratios?.at(0) ?? 0,
  }
}
export async function renderFiatCompareChart({
  baseQ,
  targetQ,
  chartLabel,
  days = ChartViewTimeOption.M1,
}: {
  baseQ: string
  targetQ: string
  chartLabel: string
  days?: ChartViewTimeOption
}) {
  const { ok, data } = await defi.getFiatHistoricalData({
    base: baseQ,
    target: targetQ,
    days,
  })
  if (!ok) return { chart: null, latest_rate: 0 }
  const { times, rates: ratios, latest_rate, from, to } = data
  if (!times || !times.length) return { chart: null, latest_rate: 0 }
  const image = await renderChartImage({
    chartLabel: `${chartLabel} | ${from} - ${to}`,
    labels: times,
    data: ratios,
  })

  return {
    chart: new MessageAttachment(image, "chart.png"),
    latest_rate,
  }
}
