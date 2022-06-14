import { Command } from "types/common"
import {
  EmbedFieldData,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { PREFIX, SPACE } from "utils/constants"
import {
  capFirst,
  defaultEmojis,
  getEmoji,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import { getCommandArguments } from "utils/commands"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed,
} from "utils/discordEmbed"
import Defi from "adapters/defi"
import dayjs from "dayjs"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import * as Canvas from "canvas"

function getChartColorConfig(id: string, width: number, height: number) {
  let gradientFrom, gradientTo, borderColor
  switch (id) {
    case "bitcoin":
      borderColor = "#ffa301"
      gradientFrom = "rgba(159,110,43,0.9)"
      gradientTo = "rgba(76,66,52,0.5)"
      break
    case "ethereum":
      borderColor = "#ff0421"
      gradientFrom = "rgba(173,36,43,0.9)"
      gradientTo = "rgba(77,48,53,0.5)"
      break

    case "tether":
      borderColor = "#22a07a"
      gradientFrom = "rgba(46,78,71,0.9)"
      gradientTo = "rgba(48,63,63,0.5)"
      break
    case "binancecoin" || "terra":
      borderColor = "#f5bc00"
      gradientFrom = "rgba(172,136,41,0.9)"
      gradientTo = "rgba(73,67,55,0.5)"
      break
    case "solana":
      borderColor = "#9945ff"
      gradientFrom = "rgba(116,62,184,0.9)"
      gradientTo = "rgba(61,53,83,0.5)"
      break
    default:
      borderColor = "#009cdb"
      gradientFrom = "rgba(53,83,192,0.9)"
      gradientTo = "rgba(58,69,110,0.5)"
  }

  const canvas = Canvas.createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, gradientFrom)
  gradient.addColorStop(1, gradientTo)
  return {
    borderColor,
    backgroundColor: gradient,
  }
}

async function renderHistoricalMarketChart({
  msg,
  coinId,
  currency,
  days = 7,
}: {
  msg: Message
  coinId: string
  currency: string
  days?: number
}) {
  const { timestamps, prices, from, to } = await Defi.getHistoricalMarketData(
    msg,
    coinId,
    currency,
    days
  )
  const width = 970
  const height = 650

  // draw chart
  const chartCanvas = new ChartJSNodeCanvas({ width, height })
  const axisConfig = {
    ticks: {
      font: {
        size: 20,
      },
    },
    grid: {
      borderColor: "black",
    },
  }
  const image = await chartCanvas.renderToBuffer({
    type: "line",
    data: {
      labels: timestamps,
      datasets: [
        {
          label: `Price (${currency.toUpperCase()}), ${from} - ${to}`,
          data: prices,
          borderWidth: 6,
          pointRadius: 0,
          fill: true,
          ...getChartColorConfig(coinId, width, height),
        },
      ],
    },
    options: {
      scales: {
        y: axisConfig,
        x: axisConfig,
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 24,
            },
          },
        },
      },
    },
  })

  return new MessageAttachment(image, "chart.png")
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

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [coinId, currency, days] = input.split("_")

  const chart = await renderHistoricalMarketChart({
    msg: message,
    coinId,
    currency,
    days: +days,
  })

  // update chart image
  const [embed] = message.embeds
  await message.removeAttachments()
  embed.image.url = "attachment://chart.png"

  const selectMenu = message.components[0].components[0] as MessageSelectMenu
  const choices = ["1", "7", "30", "60", "90", "365"]
  selectMenu.options.forEach(
    (opt, i) => (opt.default = i === choices.indexOf(days))
  )

  return {
    messageOptions: {
      embeds: [embed],
      files: [chart],
      components: message.components as MessageActionRow[],
    },
    commandChoiceOptions: {
      handler,
      userId: message.author.id,
      messageId: message.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      interaction,
    },
  }
}

const tickerSelectionHandler: CommandChoiceHandler = async (
  msgOrInteraction
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [coinId, targetId, currency] = input.split("_")
  return await renderTickerEmbed(message, coinId, targetId, currency)
}

function getTicker(tickers: any[], coinId: string, targetId: string) {
  return tickers.filter(
    (t) => t.coin_id === coinId && t.target_coin_id === targetId
  )[0]
}

async function renderTickerEmbed(
  msg: Message,
  coinId: string,
  targetId: string,
  currency: string
) {
  const coin = await Defi.getCoin(msg, coinId)
  const {
    market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
  } = coin.market_data
  currency = current_price[currency.toLowerCase()]
    ? currency.toLowerCase()
    : "usd"
  const currentPrice = +current_price[currency]
  const marketCap = +market_cap[currency]
  const blank = getEmoji("blank")
  const currencyPrefix = currency === "usd" ? "$" : ""
  const ticker = targetId && getTicker(coin.tickers, coinId, targetId)
  const fields: EmbedFieldData[] = [
    {
      name: `Market cap (${currency.toUpperCase()})`,
      value: `${currencyPrefix}${marketCap.toLocaleString()} (#${
        coin.market_cap_rank
      }) ${blank}`,
      inline: true,
    },
    {
      name: `Price (${currency.toUpperCase()})`,
      value: `${currencyPrefix}${currentPrice.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })}`,
      inline: true,
    },
    ...[
      ticker
        ? {
            name: `${capFirst(ticker.coin_id)}/${capFirst(
              ticker.target_coin_id
            )}`,
            value: `${ticker.last.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}`,
            inline: true,
          }
        : { name: "\u200B", value: "\u200B", inline: true },
    ],
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
  ]

  const embedMsg = composeEmbedMessage(msg, {
    color: getChartColorConfig(coin.id, 0, 0).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
  }).addFields(fields)

  const chart = await renderHistoricalMarketChart({
    msg,
    coinId: coin.id,
    currency,
  })

  const getDropdownOptionDescription = (days: number) =>
    `${Defi.getDateStr(
      dayjs().subtract(days, "day").unix() * 1000
    )} - ${Defi.getDateStr(dayjs().unix() * 1000)}`

  const opt = (days: number): MessageSelectOptionData => ({
    label: `${days === 365 ? "1 year" : `${days} day${days > 1 ? "s" : ""}`}`,
    value: `${coin.id}_${currency}_${days}`,
    emoji: days > 1 ? "📆" : "🕒",
    description: getDropdownOptionDescription(days),
    default: days === 7,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "tickers_range_selection",
    placeholder: "Make a selection",
    options: [opt(1), opt(7), opt(30), opt(60), opt(90), opt(365)],
  })

  return {
    messageOptions: {
      files: [chart],
      embeds: [embedMsg],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    commandChoiceOptions: {
      userId: msg.author.id,
      guildId: msg.guildId,
      channelId: msg.channelId,
      handler,
    },
  }
}

function getTickerArguments(msg: Message) {
  let args = getCommandArguments(msg)
  const defaultOpt = args[args.length - 1] === "-d"
  args = args.slice(0, args.length + (defaultOpt ? -1 : 0))
  const query = args.slice(1).join(SPACE)
  const [coinQ, currency] = query.split("//")
  const [coinId, targetId] = coinQ.split("/")
  return {
    coinId,
    targetId,
    currency: currency ?? "usd",
    defaultOpt,
  }
}

const command: Command = {
  id: "ticker",
  command: "ticker",
  brief: "Display coin price and market cap",
  category: "Defi",
  run: async function (msg) {
    const { coinId, targetId, currency, defaultOpt } = getTickerArguments(msg)
    const coins = await Defi.searchCoins(msg, coinId)
    const targetCoins = targetId ? await Defi.searchCoins(msg, targetId) : null
    const coinNotFoundResponse = (coinId: string) => ({
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            description: `Cannot find any cryptocurrency with \`${coinId}\`.\nPlease try again with the symbol or full name.`,
          }),
        ],
      },
    })
    if (!coins || !coins.length) {
      return coinNotFoundResponse(coinId)
    }

    if (coins.length > 1 && !defaultOpt) {
      const opt = (coin: any): MessageSelectOptionData => ({
        label: `${coin.name} (${coin.symbol})`,
        value: `${coin.id}_${currency}`,
      })
      const selectRow = composeDiscordSelectionRow({
        customId: "tickers_selection",
        placeholder: "Make a selection",
        options: coins.map((c: any) => opt(c)),
      })

      const found = coins
        .map(
          (c: { name: string; symbol: string }) => `**${c.name}** (${c.symbol})`
        )
        .join(", ")
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: `${defaultEmojis.MAG} Multiple tickers found`,
              description: `Multiple tickers found for \`${coinId}\`: ${found}.\nPlease select one of the following tokens`,
            }),
          ],
          components: [selectRow, composeDiscordExitButton(msg.author.id)],
        },
        commandChoiceOptions: {
          userId: msg.author.id,
          guildId: msg.guildId,
          channelId: msg.channelId,
          handler: tickerSelectionHandler,
        },
      }
    }

    return await renderTickerEmbed(
      msg,
      coins[0].id,
      targetCoins?.[0].id,
      currency
    )
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}ticker <base>[/target][//currency] [-d]`,
        examples: `${PREFIX}ticker ftm\n${PREFIX}ticker ftm -d (for default option)\n${PREFIX}ticker ftm/tomb\n${PREFIX}ticker ftm//eur\n`,
      }),
    ],
  }),
  aliases: ["tick"],
  canRunWithoutAction: true,
}

export default command
