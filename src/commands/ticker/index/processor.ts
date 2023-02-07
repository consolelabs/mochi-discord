import community from "adapters/community"
import defi from "adapters/defi"
import { createCanvas, loadImage } from "canvas"
import {
  ButtonInteraction,
  CommandInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { APIError } from "errors"
import TurndownService from "turndown"
import { RectangleStats } from "types/canvas"
import CacheManager from "cache/node-cache"
import { InteractionHandler } from "handlers/discord/select-menu"
import { drawRectangle } from "ui/canvas/draw"
import {
  defaultEmojis,
  emojis,
  getChance,
  getEmoji,
  roundFloatNumber,
} from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import { getChartColorConfig } from "ui/canvas/color"
import { getExitButton } from "ui/discord/button"
import { renderChartImage } from "ui/canvas/chart"
import * as processor from "./processor"

export async function renderHistoricalMarketChart({
  coinId,
  bb, // show bear/bull meme
  days = 30,
  discordId,
}: {
  coinId: string
  bb: boolean
  days?: number
  discordId?: string
}) {
  const currency = "usd"
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getHistoricalMarketData-${coinId}-${currency}-${days}`,
    call: () =>
      defi.getHistoricalMarketData({ coinId, currency, days, discordId }),
    ...(discordId && {
      callIfCached: () =>
        community.updateQuestProgress({ userId: discordId, action: "ticker" }),
    }),
  })
  if (!ok) return null
  const { times, prices, from, to } = data

  // draw chart
  const chart = await renderChartImage({
    chartLabel: `Price (${currency.toUpperCase()}) | ${from} - ${to}`,
    labels: times,
    data: prices,
    colorConfig: getChartColorConfig(coinId),
  })
  if (!bb) return new MessageAttachment(chart, "chart.png")

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
    container.h
  )

  // bull/bear
  const isAsc = prices[prices.length - 1] >= prices[0]
  const leftObj = await loadImage(
    `assets/images/${isAsc ? "blul" : "bera"}1.png`
  )
  ctx.drawImage(leftObj, container.x.from, container.y.to - 230, 130, 230)
  const rightObj = await loadImage(
    `assets/images/${isAsc ? "blul" : "bera"}2.png`
  )
  ctx.drawImage(rightObj, container.x.to - 130, container.y.to - 230, 130, 230)

  return new MessageAttachment(canvas.toBuffer(), "chart.png")
}

const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? defaultEmojis.CHART_WITH_UPWARDS_TREND
      : change === 0
      ? ""
      : defaultEmojis.CHART_WITH_DOWNWARDS_TREND
  return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
}

export async function composeTickerResponse({
  msg,
  coinId,
  days,
  discordId,
  symbol,
}: {
  msg: Message | SelectMenuInteraction | CommandInteraction
  coinId: string
  symbol: string
  days?: number
  discordId?: string
}) {
  let author: User
  if (msg instanceof Message) {
    author = msg.author
  } else {
    author = msg.user
  }
  const {
    ok,
    data: coin,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId),
  })
  if (!ok) {
    throw new APIError({ message: msg, curl, description: log })
  }
  const currency = "usd"
  const {
    market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
  } = coin.market_data
  const currentPrice = +current_price[currency]
  const marketCap = +market_cap[currency]
  const blank = getEmoji("blank")
  const bb = getChance(20)
  const embed = composeEmbedMessage(null, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
    originalMsgAuthor: author,
    ...(bb && { description: "Give credit to Tsuki Bot for the idea." }),
  }).addFields([
    {
      name: `Market cap (${currency.toUpperCase()})`,
      value: `$${marketCap.toLocaleString()} (#${
        coin.market_cap_rank
      }) ${blank}`,
      inline: true,
    },
    {
      name: `Price (${currency.toUpperCase()})`,
      value: `$${currentPrice.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })}`,
      inline: true,
    },
    { name: "\u200B", value: "\u200B", inline: true },
    {
      name: "Change (1h)",
      value: getChangePercentage(price_change_percentage_1h_in_currency.usd),
      inline: true,
    },
    {
      name: `Change (24h) ${blank}`,
      value: getChangePercentage(price_change_percentage_24h_in_currency.usd),
      inline: true,
    },
    {
      name: "Change (7d)",
      value: getChangePercentage(price_change_percentage_7d_in_currency.usd),
      inline: true,
    },
  ])

  const chart = await processor.renderHistoricalMarketChart({
    coinId: coin.id,
    bb,
    days,
    discordId,
  })
  const selectRow = composeDaysSelectMenu(
    "tickers_range_selection",
    `${coin.id}`,
    [1, 7, 30, 60, 90, 365],
    days ?? 30
  )

  const buttonRow = buildSwitchViewActionRow("ticker", {
    coinId: coin.id,
    days: days ?? 30,
    symbol,
  }).addComponents(getExitButton(author.id))

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow, buttonRow],
    },
    interactionOptions: {
      handler,
    },
  }
}

const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  await interaction.deferUpdate()
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [coinId, days] = input.split("_")
  const bb = getChance(20)
  const chart = await renderHistoricalMarketChart({
    coinId,
    days: +days,
    bb,
  })

  // update chart image
  const [embed] = message.embeds
  await message.removeAttachments()
  embed.setImage("attachment://chart.png")
  if (bb) embed.setDescription("Give credit to Tsuki Bot for the idea.")

  const selectMenu = message.components[0].components[0] as MessageSelectMenu
  const choices = ["1", "7", "30", "60", "90", "365"]
  selectMenu.options.forEach(
    (opt, i) => (opt.default = i === choices.indexOf(days))
  )
  // this code block stores current day selection
  message.components[1].components.forEach((b) => {
    const customId = b.customId
    if (!customId?.startsWith("ticker_view_")) return
    const params = customId?.split("|")
    params[2] = days
    b.customId = params.join("|")
  })

  return {
    messageOptions: {
      embeds: [embed],
      ...(chart && { files: [chart] }),
      components: message.components as MessageActionRow[],
    },
    interactionHandlerOptions: {
      handler,
    },
  }
}

function buildSwitchViewActionRow(
  currentView: string,
  params: { coinId: string; days: number; symbol: string }
) {
  const tickerBtn = new MessageButton({
    label: "Ticker",
    emoji: emojis.TICKER,
    customId: `ticker_view_chart|${params.coinId}|${params.days}|${params.symbol}`,
    style: "SECONDARY",
    disabled: currentView === "ticker",
  })
  const infoBtn = new MessageButton({
    label: "Info",
    emoji: emojis.INFO,
    customId: `ticker_view_info|${params.coinId}|${params.days}|${params.symbol}`,
    style: "SECONDARY",
    disabled: currentView === "info",
  })
  const wlPromptBtn = new MessageButton({
    label: "Add to Watchlist",
    emoji: emojis.LIKE,
    customId: `ticker_add_wl|${params.coinId}|${params.symbol}`,
    style: "SECONDARY",
  })
  return new MessageActionRow().addComponents([tickerBtn, infoBtn, wlPromptBtn])
}

export async function handleTickerViews(interaction: ButtonInteraction) {
  const msg = <Message>interaction.message
  if (interaction.customId.startsWith("ticker_view_chart")) {
    await viewTickerChart(interaction, msg)
    return
  }
  await viewTickerInfo(interaction, msg)
}

async function viewTickerChart(interaction: ButtonInteraction, msg: Message) {
  await interaction.deferUpdate()
  const [coinId, days, symbol] = interaction.customId.split("|").slice(1)
  const { messageOptions } = await composeTickerResponse({
    msg,
    coinId,
    ...(days && { days: +days }),
    symbol,
  })
  await msg.edit(messageOptions)
}

async function viewTickerInfo(interaction: ButtonInteraction, msg: Message) {
  await interaction.deferUpdate()
  const [coinId, days, symbol] = interaction.customId.split("|").slice(1)
  const { messageOptions } = await composeTokenInfoEmbed(
    msg,
    coinId,
    +days,
    symbol
  )
  await msg.edit(messageOptions)
  await msg.removeAttachments()
}

export async function composeTokenInfoEmbed(
  msg: Message,
  coinId: string,
  days: number,
  symbol: string
) {
  const {
    ok,
    data: coin,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId),
  })
  if (!ok) {
    throw new APIError({ message: msg, curl, description: log })
  }
  const embed = composeEmbedMessage(msg, {
    thumbnail: coin.image.large,
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    title: "About " + coin.name,
    footer: ["Data fetched from CoinGecko.com"],
  })
  const tdService = new TurndownService()
  const content = coin.description.en
    .split("\r\n\r\n")
    .map((v: any) => {
      return tdService.turndown(v)
    })
    .join("\r\n\r\n")
  embed.setDescription(content || "This token has not updated description yet")
  const buttonRow = buildSwitchViewActionRow("info", {
    coinId,
    days,
    symbol,
  }).addComponents(getExitButton(msg.author.id))

  return {
    messageOptions: {
      embeds: [embed],
      components: [buttonRow],
    },
  }
}
