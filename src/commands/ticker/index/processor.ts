import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import {
  ButtonInteraction,
  CommandInteraction,
  HexColorString,
  MessageActionRow,
  MessageButton,
  SelectMenuInteraction,
} from "discord.js"
import { InternalError } from "errors"
// import TurndownService from "turndown"
import { Coin } from "types/defi"
import { getChartColorConfig } from "ui/canvas/color"
import { composeEmbedMessage } from "ui/discord/embed"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import { getEmoji, getEmojiToken, TokenEmojiKey } from "utils/common"
import { formatDigit } from "utils/defi"
import {
  renderCompareTokenChart,
  renderFiatCompareChart,
  renderHistoricalMarketChart,
} from "./chart"

const CURRENCY = "usd"
const DIVIDER = getEmoji("LINE").repeat(5)

const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? getEmoji("ARROW_UP")
      : change === 0
      ? ""
      : getEmoji("ARROW_DOWN")
  return `${trend} ${formatDigit({
    value: change,
    fractionDigits: 2,
  })}%`
}

export enum ChartViewTimeOption {
  D1 = 1,
  W1 = 7,
  M1 = 30,
  D60 = 60,
  D90 = 90,
  Y1 = 365,
}

enum DominanceChartViewTimeOption {
  Y1 = 365,
  Y2 = 730,
  Y3 = 1095,
}

enum ChartType {
  Single = "single",
  Pair = "pair",
  Dominance = "dominance",
}

type Context = {
  days: ChartViewTimeOption | DominanceChartViewTimeOption
  type: ChartType
  baseCoin: Coin
  targetCoin?: Coin
}

export function renderTokenComparisonFields(baseCoin: Coin, targetCoin: Coin) {
  const baseCoinPrice = Number(baseCoin.market_data?.current_price?.usd ?? 0)
  const baseCoinCap = Number(baseCoin.market_data?.market_cap?.usd ?? 0)

  const targetCoinPrice = Number(
    targetCoin.market_data?.current_price?.usd ?? 0
  )
  const targetCoinCap = Number(targetCoin.market_data?.market_cap?.usd ?? 0)

  return [
    {
      name: `\n${DIVIDER}\n${getEmojiToken(
        baseCoin.symbol.toUpperCase() as TokenEmojiKey
      )} ${baseCoin.symbol.toUpperCase()}`,
      value: [
        `${getEmoji("ANIMATED_COIN_2", true)} Price: \`$${formatDigit({
          value: baseCoinPrice,
          fractionDigits: baseCoinPrice >= 100 ? 0 : 2,
        })}\``,
        `${getEmoji("CHART")} Cap: \`$${formatDigit({
          value: baseCoinCap,
          fractionDigits: 0,
          shorten: true,
        })}\``,
      ].join("\n"),
      inline: true,
    },
    {
      name: `\u200b\n${getEmojiToken(
        targetCoin.symbol.toUpperCase() as TokenEmojiKey
      )} ${targetCoin.symbol.toUpperCase()}`,
      value: [
        `${getEmoji("ANIMATED_COIN_2", true)} Price: \`$${formatDigit({
          value: targetCoinPrice,
          fractionDigits: targetCoinPrice >= 100 ? 0 : 2,
        })}\``,
        `${getEmoji("CHART")} Cap: \`$${formatDigit({
          value: targetCoinCap,
          fractionDigits: 0,
          shorten: true,
        })}\``,
      ].join("\n"),
      inline: true,
    },
  ]
}

export async function renderSingle(
  interaction: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  { days, baseCoin: coin, type }: Context
) {
  days = days ?? (type === ChartType.Dominance ? 365 : 30)

  const {
    market_cap,
    total_market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
  } = coin.market_data
  const current =
    type === ChartType.Dominance
      ? `${formatDigit({
          value: String(
            (market_cap[CURRENCY] * 100) / total_market_cap[CURRENCY]
          ),
          fractionDigits: 2,
        })}%`
      : `$${formatDigit({
          value: String(current_price[CURRENCY]),
          fractionDigits: 2,
          scientificFormat: true,
        })}`
  const marketCap = +market_cap[CURRENCY]
  const embed = composeEmbedMessage(null, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    image: "attachment://chart.png",
  }).addFields([
    {
      name: `${getEmoji("CHART")} Market cap`,
      value: `$${formatDigit({ value: marketCap, shorten: true })} (#${
        coin.market_cap_rank
      })`,
      inline: true,
    },
    {
      name: `${
        type === ChartType.Dominance
          ? "Market cap (%)"
          : `${getEmoji("CASH")} Price`
      }`,
      value: current,
      inline: true,
    },
    {
      name: "Chain",
      value:
        coin.asset_platform?.name ||
        coin.asset_platform?.shortname ||
        coin.name,
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

  const chart = await renderHistoricalMarketChart({
    coinId: coin.id,
    days,
    discordId: interaction.user.id,
    isDominanceChart: type === ChartType.Dominance,
  })
  const selectRow = composeDaysSelectMenu(
    "change_time_option",
    Object.values(
      type === ChartType.Dominance
        ? DominanceChartViewTimeOption
        : ChartViewTimeOption
    ).filter((opt) => typeof opt === "number"),
    days
  )

  const wlAdded = await isTickerAddedToWl(coin.id, interaction.user.id)
  const buttonRow = buildSwitchViewActionRow("ticker", wlAdded)

  return {
    initial: "ticker",
    context: {
      baseCoin: coin,
      type,
      days,
      toId: coin.id,
    },
    msgOpts: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow, buttonRow],
    },
  }
}

function buildSwitchViewActionRow(currentView: string, added: boolean) {
  const tickerBtn = new MessageButton({
    label: "Ticker",
    emoji: getEmoji("ANIMATED_DIAMOND", true),
    customId: `view_chart`,
    style: "SECONDARY",
    disabled: currentView === "ticker",
  })
  const infoBtn = new MessageButton({
    label: "Info",
    emoji: getEmoji("LEAF"),
    customId: `view_info`,
    style: "SECONDARY",
    disabled: currentView === "info",
  })
  const wlAddBtn = new MessageButton({
    label: "\u200b",
    emoji: getEmoji("ANIMATED_STAR", true),
    customId: `add_to_watchlist`,
    style: "SECONDARY",
  })
  const swapBtn = new MessageButton({
    label: "Swap",
    emoji: getEmoji("SWAP_ROUTE"),
    customId: "swap",
    style: "SECONDARY",
  })
  const addAlertBtn = new MessageButton({
    label: "Alert",
    emoji: getEmoji("BELL"),
    customId: "add_price_alert",
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

export async function composeTokenInfoEmbed(
  interaction: ButtonInteraction,
  { baseCoin: coin }: Context
) {
  const embed = composeEmbedMessage(null, {
    thumbnail: coin.image.large,
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    title: "About " + coin.name,
  })
  // const tdService = new TurndownService()
  const content = coin.coingecko_info.description_lines[0]

  embed.setDescription(content || "This token has not updated description yet")

  embed.addFields([
    {
      name: "Circulating",
      value: `${formatDigit({
        value: coin.market_data.circulating_supply,
        shorten: true,
      })}`,
      inline: true,
    },
    {
      name: "Total Supply",
      value: `${formatDigit({
        value: coin.market_data.total_supply,
        shorten: true,
      })}`,
      inline: true,
    },
    {
      name: "Max Supply",
      value: `${formatDigit({
        value: coin.market_data.max_supply,
        shorten: true,
      })}`,
      inline: true,
    },
    {
      name: "FDV",
      value: `$${formatDigit({
        value: coin.market_data.fully_diluted_valuation?.[CURRENCY],
        shorten: true,
      })}`,
      inline: true,
    },
    {
      name: "Tags",
      // only get items that contain "Ecosystem" and remove the word "Ecosystem"
      value: coin.categories.join(", "),
      inline: true,
    },
    {
      name: "Addresses",
      // hyper link the key and value: coin.coingecko_info.explorers
      value: coin.coingecko_info.explorers
        .map((explorer) => `[${explorer.key}](${explorer.value})`)
        .join(", "),
      inline: true,
    },
  ])

  const wlAdded = await isTickerAddedToWl(coin.id, interaction.user.id)
  const buttonRow = buildSwitchViewActionRow("info", wlAdded)

  return {
    msgOpts: {
      files: [],
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

function parseQuery(query: string) {
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

export async function renderPair(
  interaction: CommandInteraction | SelectMenuInteraction,
  { baseCoin, targetCoin, type, days }: Context
) {
  if (!targetCoin) return renderSingle(interaction, { baseCoin, type, days })
  const { chart, ratio } = await renderCompareTokenChart({
    days: days as ChartViewTimeOption,
    baseId: baseCoin.id,
    targetId: targetCoin.id,
    guildId: interaction.guildId ?? "",
    chartLabel: `Price ratio | ${baseCoin.symbol} - ${targetCoin.symbol}`,
  })
  const embed = composeEmbedMessage(null, {
    color: getChartColorConfig().borderColor as HexColorString,
    author: [`${baseCoin.name} vs. ${targetCoin.name}`],
    image: "attachment://chart.png",
    description: `**Ratio**: \`${ratio}\``,
  }).addFields(...renderTokenComparisonFields(baseCoin, targetCoin))
  const selectRow = composeDaysSelectMenu(
    "change_time_option",
    Object.values(
      type === ChartType.Dominance
        ? DominanceChartViewTimeOption
        : ChartViewTimeOption
    ).filter((opt) => typeof opt === "number"),
    days
  )

  return {
    initial: "tickerPair",
    context: {
      baseCoin,
      targetCoin,
      type,
      days,
    },
    msgOpts: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow],
    },
  }
}

export async function renderFiatPair({
  baseQ,
  targetQ,
  days,
}: Pick<Context, "days"> & { baseQ: string; targetQ: string }) {
  const { chart, latest_rate } = await renderFiatCompareChart({
    days: days as ChartViewTimeOption,
    baseQ,
    targetQ,
    chartLabel: `Exchange rates`,
  })
  const embed = composeEmbedMessage(null, {
    author: [`${baseQ.toUpperCase()} vs. ${targetQ.toUpperCase()}`],
    image: "attachment://chart.png",
    description: `**Current rate:** \`${latest_rate}\``,
  })
  const selectRow = composeDaysSelectMenu(
    "change_time_option",
    Object.values(ChartViewTimeOption).filter(
      (opt) => typeof opt === "number"
    ) as number[],
    days
  )

  return {
    initial: "tickerFiatPair",
    context: {
      baseQ,
      targetQ,
      days,
    },
    msgOpts: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow],
    },
  }
}

export async function run(
  interaction: CommandInteraction,
  baseQ: string,
  targetQ: string,
  isCompare: boolean,
  isFiat: boolean
) {
  if (isFiat)
    return renderFiatPair({
      baseQ,
      targetQ,
      days: ChartViewTimeOption.M1,
    })
  const [baseCoin, targetCoin] = await Promise.all(
    [baseQ, targetQ].filter(Boolean).map(async (symbol) => {
      const { ticker, isDominanceChart } = parseQuery(symbol)
      const { data: coins } = await CacheManager.get({
        pool: "ticker",
        key: `ticker-search-${ticker}`,
        call: () => defi.searchCoins(ticker),
      })
      if (!coins || !coins.length) {
        throw new InternalError({
          title: "Unsupported token/fiat",
          msgOrInteraction: interaction,
          description: `**${symbol.toUpperCase()}** is invalid or hasn't been supported.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Or choose a valid fiat currency.`,
        })
      }

      let coin = coins.find((coin: any) => coin.most_popular)
      if (!coin) {
        coin = coins.at(0)
      }

      const { data, status } = await CacheManager.get({
        pool: "ticker",
        key: `ticker-getcoin-${coin.id}`,
        call: () => defi.getCoin(coin.id, isDominanceChart),
      })

      if (status === 404) {
        throw new InternalError({
          title: "Unsupported token",
          msgOrInteraction: interaction,
          description: `Token is invalid or hasn't been supported.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} or Please choose a valid fiat currency.`,
        })
      }

      return data
    })
  )

  if (
    isCompare &&
    [baseQ, targetQ].map(parseQuery).every((isDominance) => !isDominance)
  ) {
    return renderPair(interaction, {
      baseCoin,
      targetCoin,
      type: ChartType.Pair,
      days: ChartViewTimeOption.M1,
    })
  }

  return renderSingle(interaction, {
    baseCoin,
    type: parseQuery(baseQ).isDominanceChart
      ? ChartType.Dominance
      : ChartType.Single,
    days: parseQuery(baseQ).isDominanceChart
      ? DominanceChartViewTimeOption.Y1
      : ChartViewTimeOption.M1,
  })
}
