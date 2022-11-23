import { SlashCommand } from "types/common"
import {
  CommandInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import {
  defaultEmojis,
  emojis,
  getChance,
  getEmoji,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import {
  composeEmbedMessage,
  composeDaysSelectMenu,
  composeEmbedMessage2,
  getExitButton,
} from "utils/discordEmbed"
import defi from "adapters/defi"
import {
  drawRectangle,
  getChartColorConfig,
  renderChartImage,
} from "utils/canvas"
import config from "adapters/config"
import { SlashCommandBuilder } from "@discordjs/builders"
import Compare from "./compare_slash"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import CacheManager from "utils/CacheManager"
import { APIError, InternalError } from "errors"
import { createCanvas, loadImage } from "canvas"
import { RectangleStats } from "types/canvas"
import { InteractionHandler } from "utils/InteractionManager"
import { getDefaultSetter } from "utils/default-setters"
import community from "adapters/community"

CacheManager.init({
  ttl: 0,
  pool: "ticker",
  checkperiod: 1,
})

async function renderHistoricalMarketChart({
  coinId,
  bb, // show bear/bull meme
  days = 7,
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

  // 20% to show chart with bear/bull
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
    container.w - 68,
    container.h
  )

  // bull/bear
  const isAsc = prices[prices.length - 1] >= prices[0]
  const leftObj = await loadImage(`src/assets/${isAsc ? "blul" : "bera"}1.png`)
  ctx.drawImage(leftObj, container.x.from, container.y.to - 230, 130, 230)
  const rightObj = await loadImage(`src/assets/${isAsc ? "blul" : "bera"}2.png`)
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
    interactionOptions: {
      handler,
    },
  }
}

async function composeTickerResponse({
  coinId,
  interaction,
  symbol,
  days,
  discordId,
}: {
  coinId: string
  interaction: SelectMenuInteraction | CommandInteraction
  symbol: string
  days?: number
  discordId?: string
}) {
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
    throw new APIError({
      description: log,
      curl,
    })
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
    // originalMsgAuthor: gMember?.user,
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

  const chart = await renderHistoricalMarketChart({
    coinId: coin.id,
    bb,
    discordId,
  })
  const selectRow = composeDaysSelectMenu(
    "tickers_range_selection",
    `${coin.id}`,
    [1, 7, 30, 60, 90, 365],
    days
  )

  const buttonRow = buildSwitchViewActionRow("ticker", {
    coinId: coin.id,
    days: days ?? 7,
    symbol,
  }).addComponents(getExitButton(interaction.user.id))

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

const command: SlashCommand = {
  name: "ticker",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("ticker")
      .setDescription("Show/Compare coins price and market cap")
      .addStringOption((option) =>
        option
          .setName("base")
          .setDescription(
            "the cryptocurrency which you wanna check price. Example: FTM"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription(
            "the second cryptocurrency for comparison. Example: BTC"
          )
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const baseQ = interaction.options.getString("base")
    if (!interaction.guildId || !baseQ) return null
    // run token comparison
    const targetQ = interaction.options.getString("target")
    if (targetQ) return await Compare(interaction, baseQ, targetQ)
    const {
      ok,
      data: coins,
      log,
      curl,
    } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${baseQ}`,
      call: () => defi.searchCoins(baseQ),
    })
    if (!ok)
      throw new APIError({
        message: interaction,
        description: log,
        curl,
      })
    if (!coins || !coins.length) {
      throw new InternalError({
        message: interaction,
        description: `Cannot find any cryptocurrency with \`${baseQ}\`.\nPlease choose another one!`,
      })
    }

    if (coins.length === 1) {
      return await composeTickerResponse({
        coinId: coins[0].id,
        interaction,
        discordId: interaction.user.id,
        symbol: baseQ,
      })
    }

    // if default ticket was set then respond...
    const { symbol } = coins[0]
    const defaultTicker = await CacheManager.get({
      pool: "ticker",
      key: `ticker-default-${interaction.guildId}-${symbol}`,
      call: () =>
        config.getGuildDefaultTicker({
          guild_id: interaction.guildId ?? "",
          query: symbol,
        }),
    })
    if (defaultTicker.ok && defaultTicker.data.default_ticker) {
      return await composeTickerResponse({
        coinId: defaultTicker.data.default_ticker,
        interaction,
        discordId: interaction.user.id,
        symbol: baseQ,
      })
    }

    return {
      select: {
        options: Object.values(coins).map((coin: any) => {
          return {
            label: `${coin.name} (${coin.symbol.toUpperCase()})`,
            value: `${coin.id}_${coin.symbol}_${coin.name}`,
          }
        }),
        placeholder: "Select a token",
      },
      onDefaultSet: async (i) => {
        const [coinId, symbol, name] = i.customId.split("_")
        getDefaultSetter({
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
          description: `Next time your server members use \`$ticker\` with \`${symbol}\`, **${name}** will be the default selection`,
        })(i)
      },
      render: ({ msgOrInteraction: interaction, value }) => {
        const [coinId] = value.split("_")
        return composeTickerResponse({
          interaction,
          coinId,
          discordId: interaction.user.id,
          symbol: baseQ,
        })
      },
      ambiguousResultText: baseQ.toUpperCase(),
      multipleResultText: Object.values(coins)
        .map((c: any) => `**${c.name}** (${c.symbol.toUpperCase()})`)
        .join(", "),
    }
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Display/Compare coin price and market cap",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}ticker <symbol>\n${PREFIX}ticker <base>/<target> (comparison)`,
        examples: `${PREFIX}ticker eth\n${PREFIX}ticker fantom\n${PREFIX}ticker btc/bnb\n${PREFIX}ticker default eth`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
