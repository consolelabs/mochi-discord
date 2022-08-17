import { Command } from "types/common"
import {
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { PREFIX } from "utils/constants"
import {
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
  composeDaysSelectMenu,
} from "utils/discordEmbed"
import Defi from "adapters/defi"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { getChartColorConfig, renderChartImage } from "utils/canvas"
import compare from "./token/compare"

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
  const { times, prices, from, to } = await Defi.getHistoricalMarketData(
    msg,
    coinId,
    currency,
    days
  )

  // draw chart
  const image = await renderChartImage({
    chartLabel: `Price (${currency.toUpperCase()}), ${from} - ${to}`,
    labels: times,
    data: prices,
    colorConfig: getChartColorConfig(coinId),
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
  const coinId = interaction.values[0]
  return await composeTickerEmbed(message, coinId)
}

async function composeTickerEmbed(msg: Message, coinId: string) {
  const coin = await Defi.getCoin(msg, coinId)
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
  const currencyPrefix = currency === "usd" ? "$" : ""

  const embed = composeEmbedMessage(msg, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
  }).addFields([
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
    msg,
    coinId: coin.id,
    currency,
  })

  const selectRow = composeDaysSelectMenu(
    "tickers_range_selection",
    `${coin.id}_${currency}`,
    [1, 7, 30, 60, 90, 365]
  )

  return {
    messageOptions: {
      files: [chart],
      embeds: [embed],
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

export const coinNotFoundResponse = (msg: Message, coinQ: string) => ({
  messageOptions: {
    embeds: [
      getErrorEmbed({
        msg,
        description: `Cannot find any cryptocurrency with \`${coinQ}\`.\nPlease try again with the symbol or full name.`,
      }),
    ],
  },
})

const command: Command = {
  id: "ticker",
  command: "ticker",
  brief: "Display/Compare coin price and market cap",
  category: "Defi",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    // execute
    const [query] = args.slice(1)
    const [coinQ, targetQ] = query.split("/")
    if (targetQ) return compare.run(msg)
    const coins = await Defi.searchCoins(msg, coinQ)
    if (!coins || !coins.length) {
      return coinNotFoundResponse(msg, coinQ)
    }

    if (coins.length > 1) {
      const opt = (coin: any): MessageSelectOptionData => ({
        label: `${coin.name} (${coin.symbol})`,
        value: `${coin.id}`,
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
              description: `Multiple tickers found for \`${coinQ}\`: ${found}.\nPlease select one of the following tokens`,
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

    return await composeTickerEmbed(msg, coins[0].id)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}ticker <symbol>\n${PREFIX}ticker <base>/<target> (comparison)`,
        examples: `${PREFIX}ticker eth\n${PREFIX}ticker fantom\n${PREFIX}ticker btc/bnb`,
      }),
    ],
  }),
  aliases: ["tick"],
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 2,
}

export default command
