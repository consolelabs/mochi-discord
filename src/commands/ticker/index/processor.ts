import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import {
  ButtonInteraction,
  CommandInteraction,
  HexColorString,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { InternalError } from "errors"
import { Coin } from "types/defi"
import { getChartColorConfig } from "ui/canvas/color"
import { composeEmbedMessage } from "ui/discord/embed"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import {
  emojis,
  EmojiKey,
  getEmoji,
  getEmojiToken,
  TokenEmojiKey,
  getEmojiURL,
} from "utils/common"
import { formatDigit, formatPercentDigit, formatUsdDigit } from "utils/defi"
import {
  renderCompareTokenChart,
  renderFiatCompareChart,
  renderHistoricalMarketChart,
} from "./chart"
import { getProfileIdByDiscord } from "../../../utils/profile"

const CURRENCY = "usd"
const DIVIDER = getEmoji("LINE").repeat(5)

const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? getEmoji("ARROW_UP")
      : change === 0
      ? ""
      : getEmoji("ARROW_DOWN")
  return `${trend} ${formatPercentDigit(change)}%`
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
        `${getEmoji("ANIMATED_COIN_2", true)} Price: \`$${formatUsdDigit(
          baseCoinPrice
        )}\``,
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
        `${getEmoji("ANIMATED_COIN_2", true)} Price: \`$${formatUsdDigit(
          targetCoinPrice
        )}\``,
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
      value: `$${formatDigit({ value: marketCap, shorten: true })} ${
        coin.market_data.market_cap_rank
          ? `(#${coin.market_data.market_cap_rank})`
          : ""
      }`,
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
      name: `${getEmoji("ANIMATED_FLASH")} Chain`,
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
      value: getChangePercentage(
        price_change_percentage_7d_in_currency.usd ?? 0
      ),
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

export async function renderTokenInfo(
  interaction: ButtonInteraction | CommandInteraction,
  { baseCoin: coin, ...rest }: Context
) {
  const { data, status } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-tokeninfo-${coin.id}`,
    call: () => defi.getTokenInfo(coin.id),
  })

  if (status === 404 || !data) {
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

  const embed = composeEmbedMessage(null, {
    thumbnail: data.image?.large !== "" ? data.image?.large : null,
    color: getChartColorConfig(data.id).borderColor as HexColorString,
    title: "About " + data.name,
  })

  const content = (data.description_lines && data.description_lines[0]) ?? ""

  embed.setDescription(content || "This token has not updated description yet")

  if (data.market_data) {
    embed.addFields(
      {
        name: `${getEmoji("CHART")} Market cap`,
        value: `$${formatDigit({
          value: data.market_data.market_cap[CURRENCY],
          shorten: true,
        })} ${
          data.market_data.market_cap_rank
            ? `(#${data.market_data.market_cap_rank})`
            : ""
        }`,
        inline: true,
      },
      {
        name: `${getEmoji("ANIMATED_FLASH")} Chain`,
        value:
          data.asset_platform?.name ||
          data.asset_platform?.shortname ||
          data.name,
        inline: true,
      }
    )
  }

  if (data.market_data?.circulating_supply) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_COIN_2", true)} Circulating`,
      value: `${formatDigit({
        value: data.market_data?.circulating_supply,
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (data.market_data?.total_supply) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_COIN_3", true)} Total Supply`,
      value: `${formatDigit({
        value: coin.market_data.total_supply,
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (data.market_data?.fully_diluted_valuation?.[CURRENCY]) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_GEM", true)} FDV`,
      value: `$${formatDigit({
        value: data.market_data.fully_diluted_valuation?.[CURRENCY],
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (data.tags?.length) {
    embed.addFields({
      name: `${getEmoji("NFT2")} Tags`,
      // only get items that contain "Ecosystem" and remove the word "Ecosystem"
      value: data.tags.map((tag: any) => tag.key).join(", "),
      inline: false,
    })
  }

  if (data.explorers?.length) {
    embed.addFields({
      name: `${getEmoji("NEWS")} Addr`,
      // hyper link the key and value: coin.explorers
      // only get 3 items
      value: data.explorers
        .map((explorer: any) => `[${explorer.key}](${explorer.value})`)
        .slice(0, 3)
        .join(", "),
      inline: false,
    })
  }

  if (data.communities?.length) {
    embed.addFields({
      name: `${getEmoji("WAVING_HAND")} Communities`,
      value: data.communities
        .map(
          (c: any) => `${getEmoji(c.key as EmojiKey)} [${c.key}](${c.value})`
        )
        .join("\n"),
      inline: true,
    })
  }

  const wlAdded = await isTickerAddedToWl(coin.id, interaction.user.id)
  const buttonRow = buildSwitchViewActionRow("info", wlAdded)

  return {
    initial: "tickerInfo",
    context: {
      view: TickerView.Info,
      baseCoin: coin,
      ...rest,
    },
    msgOpts: {
      files: [],
      embeds: [embed],
      components: [buttonRow],
    },
  }
}

async function isTickerAddedToWl(coinId: string, discordId: string) {
  const profileId = await getProfileIdByDiscord(discordId)
  const wlRes = await defi.getUserWatchlist({
    profileId,
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

export async function renderAllTicker(
  baseQ: string,
  baseCoin: any,
  { days, type }: Context
) {
  const coins = []
  for (let i = 0; i < baseCoin.length; i++) {
    const { data, status } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-getcoin-${baseCoin[i].id}`,
      call: () => defi.getCoin(baseCoin[i].id || "", false),
    })

    if (status === 404) {
      throw new InternalError({
        title: "Unsupported token",
        // msgOrInteraction: null,
        description: `Token is invalid or hasn't been supported.\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} or Please choose a valid fiat currency.`,
      })
    }
    coins.push(data)
  }

  const coinEmbed = coins
    .map((coin: any) => {
      return `${coin.name}`
    })
    .join("\n")

  const embed = composeEmbedMessage(null, {
    author: [
      `Ticker ${baseQ.toUpperCase()}`,
      getEmojiURL(emojis.ANIMATED_MONEY),
    ],
    description: [
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Below is all available tokens with given ticker.`,
      getEmoji("LINE").repeat(5),
      "```",
      coinEmbed,
      "```",
    ].join("\n"),
  })

  return {
    initial: "tickerAll",
    context: { coins, type, days },
    msgOpts: {
      files: [],
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu({
            placeholder: "💰 View a token",
            custom_id: "VIEW_ALL_TICKER",
            options: coins.map((a: any) => ({
              label: `${a.name} | $${a.market_data.current_price.usd}`,
              value: a.id,
            })),
          })
        ),
      ],
    },
  }
}

export enum TickerView {
  Chart = "chart",
  Info = "info",
}

export async function run(
  interaction: CommandInteraction,
  baseQ: string,
  targetQ: string,
  isCompare: boolean,
  isFiat: boolean,
  showAll: boolean,
  view = TickerView.Chart
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
        call: () => defi.searchCoins(ticker, "", interaction.guildId ?? ""),
      })
      if (!coins || !coins.length) {
        throw new InternalError({
          title: "Unsupported token/fiat",
          msgOrInteraction: interaction,
          descriptions: [
            "Please choose a token that is listed on [CoinGecko](https://www.coingecko.com)",
            "Or choose a valid fiat currency.",
          ],
          reason: `**${symbol.toUpperCase()}** is invalid or hasn't been supported.`,
        })
      }

      if (showAll) {
        return coins.filter((coin: any) => !coin.is_not_supported)
      }

      let coin = coins.find((coin: any) => coin.most_popular)
      if (!coin) {
        coin = coins.at(0)
      }

      let data, status
      ;({ data, status } = await CacheManager.get({
        pool: "ticker",
        key: `ticker-getcoin-${coin.id}`,
        call: () => defi.getCoin(coin.id, isDominanceChart),
      }))

      if (status === 404) {
        const fallBackCoins = coins.filter((c: any) => c.id != coin.id)
        if (!fallBackCoins.length) {
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

        ;({ data, status } = await CacheManager.get({
          pool: "ticker",
          key: `ticker-getcoin-${fallBackCoins[0].id}`,
          call: () => defi.getCoin(fallBackCoins[0].id, isDominanceChart),
        }))
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
      }

      return data
    })
  )

  const type = parseQuery(baseQ).isDominanceChart
    ? ChartType.Dominance
    : ChartType.Single
  const days = parseQuery(baseQ).isDominanceChart
    ? DominanceChartViewTimeOption.Y1
    : ChartViewTimeOption.M1

  if (showAll) {
    return renderAllTicker(baseQ, baseCoin, { baseCoin, type, days })
  }

  if (view === TickerView.Info) {
    return renderTokenInfo(interaction, { baseCoin, type, days })
  }

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
    type,
    days,
  })
}
