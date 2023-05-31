import community from "adapters/community"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
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
} from "discord.js"
import { APIError, InternalError } from "errors"
import TurndownService from "turndown"
import { RectangleStats } from "types/canvas"
import { renderChartImage } from "ui/canvas/chart"
import { getChartColorConfig } from "ui/canvas/color"
import { drawRectangle } from "ui/canvas/draw"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import {
  EmojiKey,
  getAuthor,
  getChance,
  getEmoji,
  roundFloatNumber,
} from "utils/common"
import { formatDigit } from "utils/defi"
import config from "../../../adapters/config"
import { getDefaultSetter } from "../../../utils/default-setters"

export async function renderHistoricalMarketChart({
  coinId,
  bb, // show bear/bull meme
  days,
  discordId,
  isDominanceChart,
}: {
  coinId: string
  bb: boolean
  days: number
  discordId?: string
  isDominanceChart: boolean
}) {
  const currency = "usd"
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getHistoricalMarketData-${coinId}-${currency}-${days}`,
    call: () =>
      defi.getHistoricalMarketData({
        coinId,
        currency,
        days,
        discordId,
        isDominanceChart,
      }),
    ...(discordId && {
      callIfCached: () =>
        community.updateQuestProgress({ userId: discordId, action: "ticker" }),
    }),
  })
  if (!ok) return null
  const { times, prices, from, to } = data

  // draw chart
  const chartLabel = `${
    isDominanceChart
      ? "Market cap percentage (%)"
      : `Price (${currency.toUpperCase()})`
  } | ${from} - ${to}`
  const chart = await renderChartImage({
    chartLabel,
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
      ? getEmoji("ARROW_UP")
      : change === 0
      ? ""
      : getEmoji("ARROW_DOWN")
  return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
}

export async function composeTickerResponse({
  msgOrInteraction,
  coinId,
  days,
  discordId,
  symbol,
  isDominanceChart,
  chain,
}: {
  msgOrInteraction: Message | CommandInteraction
  coinId: string
  symbol: string
  days?: number
  discordId: string
  isDominanceChart: boolean
  chain?: string
}) {
  const {
    ok,
    data: coin,
    log,
    curl,
    status,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId, isDominanceChart, chain),
  })
  if (status === 404) {
    throw new InternalError({
      title: "Unsupported token",
      msgOrInteraction,
      description: `Token is invalid or hasn't been supported.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} or Please choose a valid fiat currency.`,
    })
  }
  if (!ok) {
    throw new APIError({ curl, description: log })
  }

  const currency = "usd"
  const {
    market_cap,
    total_market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
  } = coin.market_data
  const current = isDominanceChart
    ? `${formatDigit({
        value: String(
          (market_cap[currency] * 100) / total_market_cap[currency]
        ),
        fractionDigits: 2,
      })}%`
    : `$${formatDigit({
        value: String(current_price[currency]),
        fractionDigits: 2,
      })}`
  const marketCap = +market_cap[currency]
  const bb = getChance(20)
  const embed = composeEmbedMessage(null, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
  }).addFields([
    {
      name: `${getEmoji("CHART")} Market cap`,
      value: `$${marketCap.toLocaleString()} (#${coin.market_cap_rank})`,
      inline: true,
    },
    {
      name: `${
        isDominanceChart ? "Market cap (%)" : `${getEmoji("CASH")} Price`
      }`,
      value: current,
      inline: true,
    },
    {
      name: "Chain",
      value: (coin.asset_platform_id || "N/A").toUpperCase(),
      inline: true,
    },
    {
      name: "Change (H1)",
      value: getChangePercentage(price_change_percentage_1h_in_currency.usd),
      inline: true,
    },
    {
      name: `Change (D1)`,
      value: getChangePercentage(price_change_percentage_24h_in_currency.usd),
      inline: true,
    },
    {
      name: "Change (W1)",
      value: getChangePercentage(price_change_percentage_7d_in_currency.usd),
      inline: true,
    },
  ])

  days = days ?? (isDominanceChart ? 365 : 30)
  const chart = await renderHistoricalMarketChart({
    coinId: coin.id,
    bb,
    days,
    discordId,
    isDominanceChart,
  })
  const selectRow = composeDaysSelectMenu(
    "tickers_range_selection",
    coin.id,
    getChoices(isDominanceChart),
    days
  )

  const wlAdded = await isTickerAddedToWl(coin.id, discordId)
  const buttonRow = buildSwitchViewActionRow(
    "ticker",
    { coinId: coin.id, days: days, symbol, discordId, isDominanceChart },
    wlAdded,
    {
      chain_name: coin.asset_platform_id,
    }
  )

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow, buttonRow],
    },
    interactionOptions: {
      handler: handler(isDominanceChart),
    },
  }
}

const getChoices = (isDominanceChart: boolean) => {
  if (isDominanceChart) {
    return [365, 730, 1095]
  }
  return [1, 7, 30, 60, 90, 365]
}

export const handler =
  (isDominanceChart: boolean) => async (msgOrInteraction: any) => {
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
      isDominanceChart,
    })

    // update chart image
    const [embed] = message.embeds
    await message.removeAttachments()
    embed.setImage("attachment://chart.png")

    const selectMenu = message.components[0].components[0] as MessageSelectMenu
    const choices = getChoices(isDominanceChart)
    selectMenu.options.forEach(
      (opt, i) => (opt.default = i === choices.indexOf(+days))
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

export function buildSwitchViewActionRow(
  currentView: string,
  params: {
    coinId: string
    days: number
    symbol: string
    discordId: string
    isDominanceChart: boolean
  },
  added: boolean,
  tokenInfo?: {
    chain_name: string
  }
) {
  const { coinId, days, symbol, discordId, isDominanceChart } = params
  const tickerBtn = new MessageButton({
    label: "Ticker",
    emoji: getEmoji("ANIMATED_DIAMOND", true),
    customId: `ticker_view_chart|${coinId}|${days}|${symbol}|${isDominanceChart}|${discordId}`,
    style: "SECONDARY",
    disabled: currentView === "ticker",
  })
  const infoBtn = new MessageButton({
    label: "Info",
    emoji: getEmoji("LEAF"),
    customId: `ticker_view_info|${coinId}|${days}|${symbol}|${isDominanceChart}|${discordId}`,
    style: "SECONDARY",
    disabled: currentView === "info",
  })
  const wlAddBtn = new MessageButton({
    label: "\u200b",
    emoji: getEmoji("ANIMATED_STAR", true),
    customId: `ticker_add_wl|${coinId}|${symbol}`,
    style: "SECONDARY",
  })
  const swapBtn = new MessageButton({
    label: "Swap",
    emoji: getEmoji("SWAP_ROUTE"),
    customId: `ticker_route_swap|${coinId}|${symbol}|${tokenInfo?.chain_name}`,
    style: "SECONDARY",
  })
  const addAlertBtn = new MessageButton({
    label: "Alert",
    emoji: getEmoji("BELL"),
    customId: "price_alert",
    style: "SECONDARY",
  })
  return new MessageActionRow().addComponents([
    tickerBtn,
    swapBtn,
    infoBtn,
    addAlertBtn,
    ...(added ? [] : [wlAddBtn]),
  ])
}

export async function handleTickerViews(interaction: ButtonInteraction) {
  await interaction.deferUpdate()
  const msg = <Message>interaction.message
  const discordId = interaction.customId.split("|").at(-1)
  if (discordId !== interaction.user.id) {
    return
  }
  if (interaction.customId.startsWith("ticker_view_chart")) {
    await viewTickerChart(interaction, msg)
    return
  }
  await viewTickerInfo(interaction, msg)
}

export async function viewTickerChart(
  interaction: ButtonInteraction,
  msg: Message
) {
  const [coinId, days, symbol, isDChart, discordId] = interaction.customId
    .split("|")
    .slice(1)
  const { messageOptions } = await composeTickerResponse({
    msgOrInteraction: msg,
    coinId,
    ...(days && { days: +days }),
    symbol,
    discordId,
    isDominanceChart: String(isDChart).toLowerCase() === "true",
  })
  await msg.edit(messageOptions)
}

export async function viewTickerInfo(
  interaction: ButtonInteraction,
  msg: Message
) {
  const [coinId, days, symbol, isDChart, discordId] = interaction.customId
    .split("|")
    .slice(1)
  const { messageOptions } = await composeTokenInfoEmbed(
    msg,
    coinId,
    +days,
    symbol,
    discordId,
    String(isDChart).toLowerCase() === "true"
  )
  await msg.edit(messageOptions)
  await msg.removeAttachments()
}

export async function composeTokenInfoEmbed(
  msg: Message,
  coinId: string,
  days: number,
  symbol: string,
  discordId: string,
  isDominanceChart: boolean
) {
  const {
    ok,
    data: coin,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId, isDominanceChart),
  })
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, curl, description: log })
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
  const wlAdded = await isTickerAddedToWl(coinId, discordId)
  const buttonRow = buildSwitchViewActionRow(
    "info",
    { coinId, days, symbol, discordId, isDominanceChart },
    wlAdded
  )

  return {
    messageOptions: {
      embeds: [embed],
      components: [buttonRow],
    },
  }
}

async function isTickerAddedToWl(coinId: string, discordId: string) {
  const wlRes = await defi.getUserWatchlist({
    userId: discordId,
    coinGeckoId: coinId,
  })
  return (
    wlRes.ok &&
    wlRes.data.metadata.total === 1 &&
    !wlRes.data.data[0].is_default
  )
}

export function parseQuery(query: string) {
  const result = {
    ticker: query,
    isDominanceChart: false,
  }
  if (query.endsWith(".d")) {
    result.ticker = query.slice(0, -2)
    result.isDominanceChart = true
  }
  return result
}

export async function ticker(
  msgOrInteraction: Message | CommandInteraction,
  base: string,
  chain = ""
) {
  const { ticker, isDominanceChart } = parseQuery(base)
  const {
    ok,
    data: coins,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-search-${ticker}`,
    call: () => defi.searchCoins(ticker, chain),
  })
  if (!ok) {
    throw new APIError({ msgOrInteraction, curl, description: log })
  }
  if (!coins || !coins.length) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      msgOrInteraction,
      description: `**${base.toUpperCase()}** is invalid or hasn't been supported.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} or Please choose a valid fiat currency.`,
    })
  }

  const author = getAuthor(msgOrInteraction)
  if (coins.length === 1) {
    return await composeTickerResponse({
      msgOrInteraction,
      coinId: coins[0].id,
      discordId: author.id,
      symbol: ticker,
      isDominanceChart,
      chain,
    })
  }

  // if default ticket was set then respond...
  const { symbol } = coins[0]
  const defaultTicker = await CacheManager.get({
    pool: "ticker",
    key: `ticker-default-${msgOrInteraction.guildId}-${symbol}`,
    call: () =>
      config.getGuildDefaultTicker({
        guild_id: msgOrInteraction.guildId ?? "",
        query: symbol,
      }),
  })
  if (defaultTicker.ok && defaultTicker.data.default_ticker) {
    return await composeTickerResponse({
      msgOrInteraction,
      coinId: defaultTicker.data.default_ticker,
      discordId: author.id,
      symbol: base,
      isDominanceChart,
      chain,
    })
  }

  // else render embed to show multiple results
  return {
    select: {
      options: Object.values(coins).map((coin: any, i: number) => {
        return {
          emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
          label: `💎 ${coin.name} (${coin.symbol.toUpperCase()})`,
          value: `${coin.id}_${coin.symbol}_${coin.name}`,
        }
      }),
      placeholder: "💎 Select a token",
    },
    onDefaultSet: async (i: ButtonInteraction) => {
      const [coinId, symbol, name] = i.customId.split("_")
      await getDefaultSetter({
        updateAPI: config.setGuildDefaultTicker.bind(config, {
          guild_id: i.guildId ?? "",
          query: symbol,
          default_ticker: coinId,
        }),
        updateCache: CacheManager.findAndRemove.bind(
          CacheManager,
          "ticker",
          `ticker-default-${i.guildId}-${symbol}`
        ),
        description: `Next time your server members use \`$ticker\` with \`${symbol}\`, **${name}** will be the default selection.`,
      })(i)
    },
    render: ({
      msgOrInteraction,
      value,
    }: {
      msgOrInteraction: Message | CommandInteraction
      value: string
    }) => {
      const [coinId] = value.split("_")
      return composeTickerResponse({
        msgOrInteraction,
        coinId,
        discordId: author.id,
        symbol: base,
        isDominanceChart,
        chain,
      })
    },
    title: `${getEmoji("ANIMATED_COIN_3", true)} Multiple results found`,
    description: `We're not sure which \`${base.toUpperCase()}\`, select one:\n${formatDataTable(
      coins.map((c: any) => ({
        name: c.name,
        symbol: c.symbol.toUpperCase(),
      })),
      {
        cols: ["name", "symbol"],
        rowAfterFormatter: (f, i) =>
          `${getEmoji(`NUM_${i + 1}` as EmojiKey)}${f}`,
      }
    )}`,
    ambiguousResultText: base.toUpperCase(),
    multipleResultText: "",
  }
}
