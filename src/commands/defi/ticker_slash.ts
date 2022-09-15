import { SlashCommand } from "types/common"
import {
  ButtonInteraction,
  CommandInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import {
  defaultEmojis,
  getEmoji,
  hasAdministrator,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import {
  composeDiscordSelectionRow,
  composeEmbedMessage,
  composeDaysSelectMenu,
  getSuccessEmbed,
  composeDiscordExitButton,
  composeEmbedMessage2,
} from "utils/discordEmbed"
import defi from "adapters/defi"
import {
  CommandChoiceHandler,
  EphemeralMessage,
} from "utils/CommandChoiceManager"
import { getChartColorConfig, renderChartImage } from "utils/canvas"
import config from "adapters/config"
import { Coin } from "types/defi"
import { SlashCommandBuilder } from "@discordjs/builders"
import Compare from "./token/compare_slash"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import CacheManager from "utils/CacheManager"
import { APIError, CommandError } from "errors"

CacheManager.init({
  ttl: 0,
  pool: "ticker",
  checkperiod: 1,
})

async function renderHistoricalMarketChart({
  coinId,
  days = 7,
}: {
  coinId: string
  days?: number
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
  const image = await renderChartImage({
    chartLabel: `Price (${currency.toUpperCase()}) | ${from} - ${to}`,
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
      ...(chart && { files: [chart] }),
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
  // const { message } = <{ message: Message }>interaction
  const value = interaction.values[0]
  const [coinId, coinSymbol, coinName, authorId] = value.split("_")
  return await composeTickerResponse({
    coinId,
    coinSymbol,
    coinName,
    authorId,
    interaction: interaction,
  })
}

async function composeTickerResponse({
  coinId,
  coinSymbol,
  coinName,
  authorId,
  interaction,
}: {
  coinId: string
  coinSymbol?: string
  coinName?: string
  authorId?: string
  interaction: SelectMenuInteraction | CommandInteraction
}) {
  const gMember = interaction?.guild?.members.cache.get(
    authorId ?? interaction?.user.id
  )
  // ask admin to set server default ticker
  let ephemeralMessage: EphemeralMessage | undefined
  if (hasAdministrator(gMember)) {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true })
    }
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
        composeEmbedMessage(null, {
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
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId),
  })
  if (!ok) {
    throw new APIError({
      guild: interaction.guild,
      user: interaction.user,
      description: log,
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

  const embed = composeEmbedMessage(null, {
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

  const chart = await renderHistoricalMarketChart({ coinId: coin.id })
  const selectRow = composeDaysSelectMenu(
    "tickers_range_selection",
    `${coin.id}`,
    [1, 7, 30, 60, 90, 365]
  )

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow, composeDiscordExitButton(interaction.user.id)],
    },
    commandChoiceOptions: {
      userId: interaction?.user.id,
      guildId: interaction?.guildId,
      channelId: interaction?.channelId,
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
  interaction: CommandInteraction | ButtonInteraction
) {
  const opt = (coin: Coin): MessageSelectOptionData => ({
    label: `${coin.name} (${coin.symbol})`,
    value: `${coin.id}_${coin.symbol}_${coin.name}_${interaction?.user.id}`,
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
        composeEmbedMessage(null, {
          title: `${defaultEmojis.MAG} Multiple tickers found`,
          description: `Multiple tickers found for \`${coinSymbol}\`: ${found}.\nPlease select one of the following tokens`,
        }),
      ],
      components: [selectRow, composeDiscordExitButton(interaction.user.id)],
    },
    commandChoiceOptions: {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      handler: tickerSelectionHandler,
    },
  }
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
          .setDescription("the cryptocurrency which you wanna check price.")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription("the second cryptocurrency for comparison.")
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
    } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${baseQ}`,
      call: () => defi.searchCoins(baseQ),
    })
    if (!ok)
      throw new APIError({
        guild: interaction.guild,
        user: interaction.user,
        description: log,
      })
    if (!coins || !coins.length) {
      throw new CommandError({
        guild: interaction.guild,
        user: interaction.user,
        description: `Cannot find any cryptocurrency with \`${baseQ}\`.\nPlease try again with the symbol or full name.`,
      })
    }

    if (coins.length === 1) {
      return await composeTickerResponse({ coinId: coins[0].id, interaction })
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
        coinSymbol: defaultTicker.data.query,
        interaction,
      })
    }

    // ...else allow selection
    return composeTickerSelectionResponse(
      Object.values(coins),
      symbol,
      interaction
    )
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        thumbnail: thumbnails.TOKENS,
        title: "Display/Compare coin price and market cap",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}ticker <symbol>\n${PREFIX}ticker <base>/<target> (comparison)`,
        examples: `${PREFIX}ticker eth\n${PREFIX}ticker fantom\n${PREFIX}ticker btc/bnb`,
      }),
    ],
  }),
  colorType: "Defi",
}

export default command
