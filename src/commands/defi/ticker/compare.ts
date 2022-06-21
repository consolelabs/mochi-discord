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
import { getCommandArguments } from "utils/commands"
import {
  composeDiscordSelectionRow,
  composeDiscordExitButton,
  composeEmbedMessage,
} from "utils/discordEmbed"
import Defi from "adapters/defi"
import dayjs from "dayjs"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { getGradientColor, renderChartImage } from "utils/canvas"
import { defaultEmojis, thumbnails } from "utils/common"
import { coinNotFoundResponse } from "."

function getChartColorConfig(id: string) {
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

  return {
    borderColor,
    backgroundColor: getGradientColor(gradientFrom, gradientTo),
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
  const { times, prices, from, to } = await Defi.getHistoricalMarketData(
    msg,
    coinId,
    currency,
    days
  )

  // draw chart
  const colorConfig = getChartColorConfig(coinId)
  const image = await renderChartImage({
    chartLabel: `Price (${currency.toUpperCase()}), ${from} - ${to}`,
    labels: times,
    data: prices,
    colorConfig,
  })

  return new MessageAttachment(image, "chart.png")
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
  const [coinId, targetId] = input.split("_")
  return await composeTickerComparisonEmbed(message, coinId, targetId)
}

// function getTicker(tickers: any[], coinId: string, targetId: string) {
//   return tickers.filter(
//     (t) => t.coin_id === coinId && t.target_coin_id === targetId
//   )[0]
// }

async function composeTickerComparisonEmbed(
  msg: Message,
  baseCoinId: string,
  targetCoinId: string
) {
  const baseCoin = await Defi.getCoin(msg, baseCoinId)
  const targetCoin = await Defi.getCoin(msg, targetCoinId)

  const embedMsg = composeEmbedMessage(msg, {
    color: getChartColorConfig(baseCoin.id).borderColor as HexColorString,
    author: [`${baseCoin.name}/${targetCoin.name}`],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
  })

  const chart = await renderHistoricalMarketChart({
    msg,
    coinId: baseCoinId,
    currency: "usd",
  })

  const getDropdownOptionDescription = (days: number) =>
    `${Defi.getDateStr(
      dayjs().subtract(days, "day").unix() * 1000
    )} - ${Defi.getDateStr(dayjs().unix() * 1000)}`

  const opt = (days: number): MessageSelectOptionData => ({
    label: `${days === 365 ? "1 year" : `${days} day${days > 1 ? "s" : ""}`}`,
    value: `${baseCoinId}_${targetCoinId}_${days}`,
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

const command: Command = {
  id: "ticker_compare",
  command: "compare",
  brief: "View comparison between 2 tokens",
  category: "Defi",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const defaultOpt = args[args.length - 1] === "-d"
    const [query] = args.slice(2)
    const [baseQ, targetQ] = query.split("/")
    const baseCoins = await Defi.searchCoins(msg, baseQ)
    const targetCoins = await Defi.searchCoins(msg, targetQ)
    if (!baseCoins || !baseCoins.length) {
      return coinNotFoundResponse(msg, baseQ)
    }
    if (!targetCoins || !targetCoins.length) {
      return coinNotFoundResponse(msg, targetQ)
    }

    if (baseCoins.length > 1 || (targetCoins.length > 1 && !defaultOpt)) {
      const opt = (base: any, target: any): MessageSelectOptionData => ({
        label: `${base.name}/${target.name}`,
        value: `${base.id}_${target.id}`,
      })
      const selectRow = composeDiscordSelectionRow({
        customId: "tickers_selection",
        placeholder: "Make a selection",
        options: baseCoins.map((b: any) =>
          targetCoins.map((t: any) => opt(b, t))
        ),
      })

      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: `${defaultEmojis.MAG} Multiple tickers found`,
              description: `Multiple options found for \`${baseQ}/${targetQ}\`.\nPlease select one of the following...`,
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

    return await composeTickerComparisonEmbed(
      msg,
      baseCoins[0].id,
      targetCoins[0].id
    )
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        usage: `${PREFIX}ticker c <base/target> [-d]`,
        examples: `${PREFIX}ticker c fantom/tomb -d\n${PREFIX}ticker ftm/eth -d (for default option)`,
      }),
    ],
  }),
  aliases: ["c"],
  canRunWithoutAction: true,
}

export default command
