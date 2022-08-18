import { Command } from "types/common"
import {
  ButtonInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { PREFIX } from "utils/constants"
import {
  defaultEmojis,
  getEmoji,
  hasAdministrator,
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
  getSuccessEmbed,
  getExitButton,
} from "utils/discordEmbed"
import Defi from "adapters/defi"
import {
  CommandChoiceHandler,
  EphemeralMessage,
} from "utils/CommandChoiceManager"
import { getChartColorConfig, renderChartImage } from "utils/canvas"
import compare from "./token/compare"
import config from "adapters/config"

async function renderHistoricalMarketChart({
  msg,
  coinId,
  days = 7,
}: {
  msg: Message
  coinId: string
  days?: number
}) {
  const currency = "usd"
  const { times, prices, from, to } = await Defi.getHistoricalMarketData(
    msg,
    coinId,
    currency,
    days || 7
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
  const [coinId, days] = input.split("_")

  const chart = await renderHistoricalMarketChart({
    msg: message,
    coinId,
    days: +days,
  })

  // update chart image
  const [embed] = message.embeds
  await message.removeAttachments()
  // embed.image.url = "attachment://chart.png"
  embed.setImage("attachment://chart.png")

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
  interaction
  const { message } = <{ message: Message }>interaction
  const value = interaction.values[0]
  const [coinId, coinName, coinQ, authorId] = value.split("_")
  // message.author.id = authorId
  return await composeTickerEmbed({
    msg: message,
    coinId,
    coinName,
    coinQ,
    authorId,
  })
}

async function composeTickerEmbed({
  msg,
  coinId,
  coinName,
  coinQ,
  authorId,
  hasDefault,
}: {
  msg: Message
  coinId: string
  coinName?: string
  coinQ?: string
  authorId?: string
  hasDefault?: boolean
}) {
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

  const gMember = msg.guild.members.cache.get(authorId ?? msg.author.id)
  const embed = composeEmbedMessage(msg, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
    originalMsgAuthor: gMember?.user,
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

  const chart = await renderHistoricalMarketChart({ msg, coinId: coin.id })

  const selectRow = composeDaysSelectMenu(
    "tickers_range_selection",
    `${coin.id}`,
    [1, 7, 30, 60, 90, 365]
  )

  // set server default ticker
  let ephemeralMessage: EphemeralMessage
  if (hasAdministrator(gMember)) {
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: `confirm_ticker|${coinQ}|${coinId}|${coinName}|${authorId}`,
        emoji: getEmoji("approve"),
        style: "PRIMARY",
        label: "Confirm",
      })
    )
    ephemeralMessage = {
      embeds: [
        composeEmbedMessage(msg, {
          title: "Set default ticker",
          description: `Do you want to set **${coinName}** as your server default ticker?\nNo further selection next time use \`$ticker\``,
        }),
      ],
      components: [actionRow],
      buttonCollector: setDefaultTicker,
    }
  }

  const buttonRow = new MessageActionRow()
  if (hasDefault) {
    //   buttonRow.addComponents(
    //     new MessageButton({
    //       customId: `ticker_selection-${coinQ}-${msg.author.id}`,
    //       emoji: getEmoji("swap"),
    //       style: "PRIMARY",
    //       label: "Select others",
    //     })
    //   )
  }
  buttonRow.addComponents(getExitButton(msg.author.id))

  return {
    messageOptions: {
      files: [chart],
      embeds: [embed],
      components: [selectRow, buttonRow],
    },
    commandChoiceOptions: {
      userId: msg.author.id,
      guildId: msg.guildId,
      channelId: msg.channelId,
      handler,
    },
    ephemeralMessage,
  }
}

export async function backToTickerSelection(
  i: ButtonInteraction,
  msg: Message
) {
  await i.deferUpdate()
  const [coinQ, authorId] = i.customId.split("-").slice(1)
  msg.author.id = authorId
  const coins = await Defi.searchCoins(msg, coinQ)
  const { messageOptions } = await composeTickerSelectionResponse(
    coins,
    coinQ,
    msg
  )
  await msg.removeAttachments()
  msg.edit({
    embeds: messageOptions.embeds,
    components: messageOptions.components,
    files: [],
  })
}

export async function setDefaultTicker(i: ButtonInteraction) {
  const [coinQ, coinId, coinName, authorId] = i.customId.split("|").slice(1)
  if (authorId !== i.user.id) {
    await i.deferUpdate()
    return
  }
  await config.setGuildDefaultTicker({
    guild_id: i.guildId,
    query: coinQ,
    default_ticker: coinId,
  })
  const embed = getSuccessEmbed({
    msg: i.message as Message,
    title: "Default ticker ENABLED",
    description: `Next time your server members use $ticker with \`${coinQ}\`, **${coinName}** will be the default selection`,
  })
  return {
    embeds: [embed],
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

async function composeTickerSelectionResponse(
  coins: any,
  coinQ: string,
  msg: Message
) {
  const opt = (coin: any): MessageSelectOptionData => ({
    label: `${coin.name} (${coin.symbol})`,
    value: `${coin.id}_${coin.name}_${coinQ}_${msg.author.id}`,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "tickers_selection",
    placeholder: "Make a selection",
    options: coins.map((c: any) => opt(c)),
  })

  const found = coins
    .map((c: { name: string; symbol: string }) => `**${c.name}** (${c.symbol})`)
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
    // run token comparison
    if (targetQ) return compare.run(msg)
    const coins = await Defi.searchCoins(msg, coinQ)
    if (!coins || !coins.length) {
      return coinNotFoundResponse(msg, coinQ)
    }

    if (coins.length === 1) {
      return await composeTickerEmbed({ msg, coinId: coins[0].id })
    }

    // multiple tickers found
    // 1. get server default ticker
    const data = await config.getGuildDefaultTicker({
      guild_id: msg.guildId,
      query: coinQ,
    })
    if (data && data.default_ticker) {
      return await composeTickerEmbed({
        msg,
        coinId: data.default_ticker,
        hasDefault: true,
        coinQ,
      })
    }

    // allow selection
    return composeTickerSelectionResponse(coins, coinQ, msg)
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
