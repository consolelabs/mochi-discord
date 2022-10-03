import { Command } from "types/common"
import {
  ButtonInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  // MessageEmbed,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { PREFIX, TICKER_GITBOOK, DEFI_DEFAULT_FOOTER } from "utils/constants"
import {
  defaultEmojis,
  getChance,
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
  composeDaysSelectMenu,
  getSuccessEmbed,
  getExitButton,
} from "utils/discordEmbed"
import defi from "adapters/defi"
import {
  CommandChoiceHandler,
  EphemeralMessage,
} from "utils/CommandChoiceManager"
import {
  drawRectangle,
  getChartColorConfig,
  renderChartImage,
} from "utils/canvas"
import compare from "./token/compare"
import config from "adapters/config"
import { Coin } from "types/defi"
import CacheManager from "utils/CacheManager"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"
import { createCanvas, loadImage } from "canvas"
import { RectangleStats } from "types/canvas"
import TurnDown from "turndown"

async function renderHistoricalMarketChart({
  coinId,
  days = 7,
  bb, // show bear/bull meme
}: {
  coinId: string
  days?: number
  bb: boolean
}) {
  const currency = "usd"
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getHistoricalMarketData-${coinId}-${currency}-${days}`,
    call: () => defi.getHistoricalMarketData(coinId, currency, days || 7),
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
  const leftObj = await loadImage(`src/assets/${isAsc ? "blul" : "bera"}1.png`)
  ctx.drawImage(leftObj, container.x.from, container.y.to - 230, 150, 230)
  const rightObj = await loadImage(`src/assets/${isAsc ? "blul" : "bera"}2.png`)
  ctx.drawImage(rightObj, container.x.to - 150, container.y.to - 230, 150, 230)

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

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
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
    const params = customId?.split("-")
    params[2] = days
    b.customId = params.join("-")
  })

  return {
    messageOptions: {
      embeds: [embed],
      ...(chart && { files: [chart] }),
      components: message.components as MessageActionRow[],
    },
    commandChoiceOptions: {
      handler,
      userId: message.author.id,
      messageId: message.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
    },
  }
}

const tickerSelectionHandler: CommandChoiceHandler = async (
  msgOrInteraction
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const value = interaction.values[0]
  const [coinId, coinSymbol, coinName, authorId] = value.split("_")
  return await composeTickerResponse({
    msg: message,
    coinId,
    coinSymbol,
    coinName,
    authorId,
  })
}

async function composeTickerResponse({
  msg,
  coinId,
  coinSymbol,
  coinName,
  authorId,
  days,
  interaction,
}: {
  msg: Message
  coinId: string
  coinSymbol?: string
  coinName?: string
  authorId?: string
  days?: number
  interaction?: SelectMenuInteraction
}) {
  const gMember = msg.guild?.members.cache.get(authorId ?? msg.author.id)
  // ask admin to set server default ticker
  let ephemeralMessage: EphemeralMessage | undefined
  if (hasAdministrator(gMember)) {
    await interaction?.deferReply({ ephemeral: true })
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton({
        customId: `${coinId}|${coinSymbol}|${coinName}`,
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
  const embed = composeEmbedMessage(msg, {
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    author: [coin.name, coin.image.small],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
    originalMsgAuthor: gMember?.user,
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

  const chart = await renderHistoricalMarketChart({ coinId: coin.id, bb, days })
  const selectRow = composeDaysSelectMenu(
    "tickers_range_selection",
    `${coin.id}`,
    [1, 7, 30, 60, 90, 365],
    days
  )

  const buttonRow = buildSwitchViewActionRow("ticker", {
    coinId: coin.id,
    days: days ?? 7,
  }).addComponents(getExitButton(msg.author.id))

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
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

export async function setDefaultTicker(i: ButtonInteraction) {
  const [coinId, symbol, name] = i.customId.split("|")
  await config.setGuildDefaultTicker({
    guild_id: i.guildId ?? "",
    query: symbol,
    default_ticker: coinId,
  })
  CacheManager.findAndRemove("ticker", `ticker-default-${i.guildId}-${symbol}`)
  const embed = getSuccessEmbed({
    msg: i.message as Message,
    title: "Default ticker ENABLED",
    description: `Next time your server members use $ticker with \`${symbol}\`, **${name}** will be the default selection`,
  })
  return {
    embeds: [embed],
  }
}

function composeTickerSelectionResponse(
  coins: Coin[],
  coinSymbol: string,
  msg: Message
) {
  const opt = (coin: Coin): MessageSelectOptionData => ({
    label: `${coin.name} (${coin.symbol})`,
    value: `${coin.id}_${coin.symbol}_${coin.name}_${msg.author.id}`,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "tickers_selection",
    placeholder: "Make a selection",
    options: coins.map((c: Coin) => opt(c)),
  })

  const found = coins
    .map((c: { name: string; symbol: string }) => `**${c.name}** (${c.symbol})`)
    .join(", ")
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.MAG} Multiple tickers found`,
          description: `Multiple tickers found for \`${coinSymbol}\`: ${found}.\nPlease select one of the following tokens`,
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

function buildSwitchViewActionRow(
  currentView: string,
  params: { coinId: string; days: number }
) {
  const tickerBtn = new MessageButton({
    label: "🪪 Ticker",
    customId: `ticker_view_chart-${params.coinId}-${params.days}`,
    style: "SECONDARY",
    disabled: currentView === "ticker",
  })
  const infoBtn = new MessageButton({
    label: "🖼 Info",
    customId: `ticker_view_info-${params.coinId}-${params.days}`,
    style: "SECONDARY",
    disabled: currentView === "info",
  })
  return new MessageActionRow().addComponents([tickerBtn, infoBtn])
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
  const [coinId, days] = interaction.customId.split("-").slice(1)
  const { messageOptions } = await composeTickerResponse({
    msg,
    coinId,
    ...(days && { days: +days }),
  })
  await msg.edit(messageOptions)
}

async function viewTickerInfo(interaction: ButtonInteraction, msg: Message) {
  const [coinId, days] = interaction.customId.split("-").slice(1)
  const { messageOptions } = await composeTokenInfoEmbed(msg, coinId, +days)
  await msg.edit(messageOptions)
  await msg.removeAttachments()
}

async function composeTokenInfoEmbed(
  msg: Message,
  coinId: string,
  days: number
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
  const tdService = new TurnDown()
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
  }).addComponents(getExitButton(msg.author.id))

  return {
    messageOptions: {
      embeds: [embed],
      components: [buttonRow],
    },
  }
}

const command: Command = {
  id: "ticker",
  command: "ticker",
  brief: "Token ticker",
  category: "Defi",
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    // execute
    const [query] = args.slice(1)
    const [coinQ, targetQ] = query.split("/")
    // run token comparison
    if (targetQ) return compare.run(msg)
    const {
      ok,
      data: coins,
      log,
      curl,
    } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${coinQ}`,
      call: () => defi.searchCoins(coinQ),
    })
    if (!ok) throw new APIError({ message: msg, curl, description: log })
    if (!coins || !coins.length) {
      throw new CommandError({
        message: msg,
        description: `Cannot find any cryptocurrency with \`${coinQ}\`.\nPlease choose another one!`,
      })
    }

    if (coins.length === 1) {
      return await composeTickerResponse({ msg, coinId: coins[0].id })
    }

    // if default ticket was set then respond...
    const { symbol } = coins[0]
    const defaultTicker = await CacheManager.get({
      pool: "ticker",
      key: `ticker-default-${msg.guildId}-${symbol}`,
      call: () =>
        config.getGuildDefaultTicker({
          guild_id: msg.guildId ?? "",
          query: symbol,
        }),
    })
    if (defaultTicker.ok && defaultTicker.data.default_ticker) {
      return await composeTickerResponse({
        msg,
        coinId: defaultTicker.data.default_ticker,
        coinSymbol: defaultTicker.data.query,
      })
    }

    // ...else allow selection
    return composeTickerSelectionResponse(Object.values(coins), symbol, msg)
  },
  featured: {
    title: `📈 Ticker`,
    description: `Display/Compare coin prices and market cap`,
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        description: `Display/Compare coin prices and market cap. Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}ticker <symbol>\n${PREFIX}ticker <base>/<target> (comparison)`,
        examples: `${PREFIX}ticker eth\n${PREFIX}ticker fantom\n${PREFIX}ticker btc/bnb`,
        document: TICKER_GITBOOK,
        footer: [DEFI_DEFAULT_FOOTER],
      }),
    ],
  }),
  aliases: ["tick"],
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 2,
}

export default command
