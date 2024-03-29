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
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import {
  composeDaysSelectMenu,
  composeOtherTickerSelectMenu,
} from "ui/discord/select-menu"
import {
  emojis,
  EmojiKey,
  getEmoji,
  getEmojiToken,
  TokenEmojiKey,
  getEmojiURL,
  shortenHashOrAddress,
} from "utils/common"
import {
  renderCompareTokenChart,
  renderFiatCompareChart,
  renderHistoricalMarketChart,
} from "./chart"
import { getProfileIdByDiscord } from "../../../utils/profile"
import { utils } from "@consolelabs/mochi-formatter"
import moment from "moment-timezone"
import { formatBigNumber } from "utils/convert"
import { uniqBy } from "lodash"

const CURRENCY = "usd"
const DIVIDER = getEmoji("LINE").repeat(5)

const getChangePercentage = (change: number) => {
  const trend =
    change > 0
      ? getEmoji("ARROW_UP")
      : change === 0
      ? ""
      : getEmoji("ARROW_DOWN")
  return `${trend} ${utils.formatPercentDigit(change)}`
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
  listCoins?: Coin[]
}

export function renderTokenComparisonFields(baseCoin: Coin, targetCoin: Coin) {
  const baseCoinPrice = Number(baseCoin.market_data?.current_price?.usd ?? 0)
  const baseCoinCap = Number(baseCoin.market_data?.market_cap?.usd ?? 0)

  const targetCoinPrice = Number(
    targetCoin.market_data?.current_price?.usd ?? 0,
  )
  const targetCoinCap = Number(targetCoin.market_data?.market_cap?.usd ?? 0)

  return [
    {
      name: `\n${DIVIDER}\n${getEmojiToken(
        baseCoin.symbol.toUpperCase() as TokenEmojiKey,
      )} ${baseCoin.symbol.toUpperCase()}`,
      value: [
        `${getEmoji(
          "ANIMATED_COIN_2",
          true,
        )} Price: \`${utils.formatUsdPriceDigit(baseCoinPrice)}\``,
        `${getEmoji("CHART")} Cap: \`${utils.formatUsdDigit(baseCoinCap)}\``,
      ].join("\n"),
      inline: true,
    },
    {
      name: `\u200b\n${getEmojiToken(
        targetCoin.symbol.toUpperCase() as TokenEmojiKey,
      )} ${targetCoin.symbol.toUpperCase()}`,
      value: [
        `${getEmoji(
          "ANIMATED_COIN_2",
          true,
        )} Price: \`${utils.formatUsdPriceDigit(targetCoinPrice)}\``,
        `${getEmoji("CHART")} Cap: \`${utils.formatUsdDigit(targetCoinCap)}\``,
      ].join("\n"),
      inline: true,
    },
  ]
}

export async function renderOtherTicker(
  // interaction: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  { baseCoin: coin, listCoins }: Context,
) {
  const remainingCoins = listCoins?.filter((c) => c.id !== coin.id)

  const selectOtherTickerRow = composeOtherTickerSelectMenu(
    "change_ticker_option",
    remainingCoins as any[],
  )

  return {
    context: {
      isOtherTicker: true,
    },
    msgOpts: {
      components: [selectOtherTickerRow],
    },
  }
}

export async function renderSingle(
  interaction: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  { days, baseCoin: coin, type, listCoins }: Context,
) {
  days = days ?? (type === ChartType.Dominance ? 365 : 30)
  const hasPlatforms = Object.keys(coin.platforms ?? {}).filter((p) =>
    Boolean(p),
  ).length
  const {
    market_cap,
    total_market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
    ath,
    total_volume,
    max_supply,
    total_supply,
  } = coin.market_data

  // if price is x thousands (e.g. 3.5k), show without shorten format
  const isPriceThousands =
    current_price?.[CURRENCY] >= 1000 && current_price?.[CURRENCY] < 1000000
  const currentPrice = isPriceThousands
    ? utils.formatUsdPriceDigit({
        value: current_price[CURRENCY],
        shorten: false,
      })
    : utils.formatUsdPriceDigit({
        value: current_price?.[CURRENCY] ?? 0,
        subscript: true,
      })

  // ath price
  const isAthThousands = ath?.[CURRENCY] >= 1000 && ath?.[CURRENCY] < 1000000
  const athPrice = isAthThousands
    ? utils.formatUsdPriceDigit({
        value: ath[CURRENCY],
        shorten: false,
      })
    : utils.formatUsdPriceDigit({
        value: ath?.[CURRENCY] ?? 0,
        subscript: true,
      })

  const current =
    type === ChartType.Dominance
      ? utils.formatPercentDigit(
          String(
            ((market_cap?.[CURRENCY] ?? 0) * 100) /
              (total_market_cap?.[CURRENCY] ?? 0),
          ),
        )
      : currentPrice

  // dexscreener data
  const { data: dexScreenerData }: any = await defi.searchDexScreenerPairs({
    token_address: coin.contract_address,
    symbol: coin.symbol,
  })
  const pair = dexScreenerData?.pairs?.[0]

  //
  const maxSupply = max_supply || total_supply
  const calculatedFdv = maxSupply
    ? `$${formatBigNumber((current_price?.[CURRENCY] ?? 0) * maxSupply)}`
    : "N/A"
  const fdv = pair.fdv ? `$${formatBigNumber(pair.fdv)}` : calculatedFdv

  // exchange platforms
  const tickers = [
    ...(coin.tickers || []).map((ticker: any) => ({
      ...ticker,
      volume_usd_24h: ticker?.converted_volume?.[CURRENCY],
    })),
  ]
  const exchangePlats = uniqBy(
    [
      ...(pair
        ? [
            {
              market: { name: "Dex Screener" },
              trade_url: pair.url.dexscreener,
              volume_usd_24h: pair.volume_usd_24h,
            },
          ]
        : []),
      ...tickers.sort((a, b) => b.volume_usd_24h - a.volume_usd_24h),
    ],
    (ticker: any) => ticker.market.name,
  ).map((ticker) => `[${ticker.market.name}](${ticker.trade_url})`)

  // age
  const icoDate = (coin as any)?.ico_data?.ico_start_date
  const diff = moment.duration(
    moment(moment.now()).diff(moment(icoDate || pair?.created_at)),
  )
  const age = diff
    ? `${diff.years() ? `${diff.years()}y` : ""}${
        diff.months() ? `${diff.months()}m` : ""
      }`
    : "N/A"

  const chain =
    coin.asset_platform?.name || coin.asset_platform?.shortname || "N/A"

  const marketCap = market_cap?.[CURRENCY] ?? 0
  const fields = [
    {
      name: `${getEmoji("CHART")} Market cap`,
      value: marketCap
        ? `$${formatBigNumber(marketCap)} ${
            coin.market_data.market_cap_rank
              ? `(#${coin.market_data.market_cap_rank})`
              : ""
          }`
        : "< $0.01",
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
      name: `${getEmoji("ANIMATED_FLASH")} ATH`,
      value: ath ? athPrice : "N/A",
      inline: true,
    },
    {
      name: `${getEmoji("ANIMATED_FLASH")} Volume (24h)`,
      value: total_volume
        ? `$${formatBigNumber(total_volume[CURRENCY])}`
        : "N/A",
      inline: true,
    },
    {
      name: `${getEmoji("ANIMATED_FLASH")} Max Supply`,
      value: `${max_supply ? formatBigNumber(max_supply) : "∞"}`,
      inline: true,
    },
    {
      name: `${getEmoji("ANIMATED_FLASH")} FDV`,
      value: fdv,
      inline: true,
    },
    {
      name: "Change (H1)",
      value: getChangePercentage(
        price_change_percentage_1h_in_currency.usd ?? 0,
      ),
      inline: true,
    },
    {
      name: `Change (D1)`,
      value: getChangePercentage(
        price_change_percentage_24h_in_currency.usd ?? 0,
      ),
      inline: true,
    },
    {
      name: "Change (W1)",
      value: getChangePercentage(
        price_change_percentage_7d_in_currency.usd ?? 0,
      ),
      inline: true,
    },
    {
      name: `${getEmoji("CLOCK")} Age`,
      value: age,
      inline: true,
    },
    {
      name: `${getEmoji("WEB")} Chain`,
      value: chain,
      inline: true,
    },
    ...(hasPlatforms && coin.asset_platform_id
      ? [
          {
            name: "Address",
            value: coin.platforms?.[coin.asset_platform_id],
            inline: false,
          },
        ]
      : []),
    // show maximum 5 exchange platforms
    ...(exchangePlats?.length
      ? [
          {
            name: `${getEmoji("CHART")} Trading`,
            value: exchangePlats.slice(0, 5).join(" | "),
            inline: false,
          },
        ]
      : []),
  ].map((item) => ({
    ...item,
    value: item.value || "N/A",
  }))
  let embed = composeEmbedMessage(null, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [`${coin.name}`, coin.image.small],
    image: "attachment://chart.png",
  }).addFields(fields)
  embed = justifyEmbedFields(embed, 3)

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
        : ChartViewTimeOption,
    ).filter((opt) => typeof opt === "number"),
    days,
  )

  const wlAdded = await isTickerAddedToWl(coin.id, interaction.user.id)
  const buttonRow = buildSwitchViewActionRow("ticker", wlAdded)
  const basicComponents = [selectRow, buttonRow]
  // const showOtherTickerRow = new MessageActionRow().addComponents(
  //   new MessageButton({
  //     label: "Not the token you're looking for?",
  //     customId: "show_other_ticker",
  //     style: "SECONDARY",
  //   }),
  // )
  const finalComponents = listCoins ? [...basicComponents] : basicComponents

  return {
    initial: "ticker",
    context: {
      baseCoin: coin,
      type,
      days,
      toId: coin.id,
      listCoins,
    },
    msgOpts: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: finalComponents,
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
  { baseCoin: coin, ...rest }: Context,
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
        true,
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
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
        value: `${utils.formatUsdDigit(
          data.market_data.market_cap?.[CURRENCY] ?? 0,
        )} ${
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
      },
    )
  }

  if (data.market_data?.circulating_supply) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_COIN_2", true)} Circulating`,
      value: utils.formatUsdDigit(data.market_data?.circulating_supply),
      inline: true,
    })
  }

  if (data.market_data?.total_supply) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_COIN_3", true)} Total Supply`,
      value: utils.formatUsdDigit(coin.market_data.total_supply),
      inline: true,
    })
  }

  if (data.market_data?.fully_diluted_valuation?.[CURRENCY]) {
    embed.addFields({
      name: `${getEmoji("ANIMATED_GEM", true)} FDV`,
      value: utils.formatUsdDigit(
        data.market_data.fully_diluted_valuation?.[CURRENCY],
      ),
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
          (c: any) => `${getEmoji(c.key as EmojiKey)} [${c.key}](${c.value})`,
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
    wlRes.ok && wlRes.data.data.length === 1 && !wlRes.data.data[0].is_default
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
  { baseCoin, targetCoin, type, days }: Context,
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
        : ChartViewTimeOption,
    ).filter((opt) => typeof opt === "number"),
    days,
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
      (opt) => typeof opt === "number",
    ) as number[],
    days,
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
  { days, type }: Context,
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
          true,
        )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true,
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
        true,
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
          }),
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
  view = TickerView.Chart,
) {
  if (isFiat)
    return renderFiatPair({
      baseQ,
      targetQ,
      days: ChartViewTimeOption.M1,
    })

  const [baseCoinRaw, targetCoin] = await Promise.all(
    [baseQ, targetQ].filter(Boolean).map(async (symbol) => {
      const { ticker, isDominanceChart } = parseQuery(symbol)
      const { data: coins } = await CacheManager.get({
        pool: "ticker",
        key: `ticker-search-${ticker}`,
        call: () => defi.searchCoins(ticker, "", interaction.guildId ?? ""),
      })
      if (!coins || !coins.length) {
        throw new InternalError({
          title: `Unsupported token/fiat ${ticker}`,
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

      const listCoins = coins

      let data, status
      ;({ data, status } = await CacheManager.get({
        pool: "ticker",
        key: `ticker-getcoin-${coin.id}`,
        ttl: 30,
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
              true,
            )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
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
              true,
            )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} or Please choose a valid fiat currency.`,
          })
        }
      }

      return [data, listCoins]
    }),
  )

  const baseCoin = baseCoinRaw[0]
  const listCoins = baseCoinRaw[1]

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
    listCoins,
  })
}
