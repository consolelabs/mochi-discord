import defi from "adapters/defi"
import {
  CommandInteraction,
  HexColorString,
  Message,
  MessageOptions,
} from "discord.js"
import { APIError, InternalError } from "errors"
import { MultipleResult, RunResult } from "types/common"
import CacheManager from "cache/node-cache"
import { getChartColorConfig } from "ui/canvas/color"
import { composeEmbedMessage } from "ui/discord/embed"
// import TurnDown from "turndown"
import config from "adapters/config"
import { getDefaultSetter } from "utils/default-setters"
import { formatDigit } from "../../../utils/defi"
import { ResponseCoinGeckoInfoKeyValue } from "../../../types/api"

const CURRENCY = "usd"

async function composeTokenInfoResponse({
  msg,
  coinId,
}: {
  msg: Message | CommandInteraction
  coinId: string
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
    throw new APIError({ msgOrInteraction: msg, curl, description: log })
  }
  const embed = composeEmbedMessage(null, {
    thumbnail: coin.image.large,
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    title: "About " + coin.name,
    footer: ["Data fetched from CoinGecko.com"],
  })
  // const tdService = new TurnDown()
  // const content = coin.coingecko_info.description
  //   .split("\n\n")
  //   .map((v: any) => {
  //     return tdService.turndown(v)
  //   })
  //   .join("\r\n\r\n")

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
        .map(
          (explorer: ResponseCoinGeckoInfoKeyValue) =>
            `[${explorer.key}](${explorer.value})`
        )
        .join(", "),
      inline: true,
    },
  ])

  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}

export async function handleTokenInfo(
  msg: Message | CommandInteraction,
  token: string
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  const {
    ok,
    data: coins,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-search-${token}`,
    call: () => defi.searchCoins(token),
  })
  if (!ok) throw new APIError({ msgOrInteraction: msg, curl, description: log })
  if (!coins || !coins.length) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: `Cannot find any cryptocurrency with \`${token}\`.\nPlease choose another one!`,
    })
  }
  if (coins.length === 1) {
    return await composeTokenInfoResponse({ msg, coinId: coins[0].id })
  }
  // if default was set then respond...
  const { symbol } = coins[0]
  const defaultToken = await CacheManager.get({
    pool: "ticker",
    key: `ticker-default-${msg.guildId}-${symbol}`,
    call: () =>
      config.getGuildDefaultTicker({
        guild_id: msg.guildId ?? "",
        query: symbol,
      }),
  })
  if (defaultToken.ok && defaultToken.data.default_ticker) {
    return await composeTokenInfoResponse({
      msg,
      coinId: defaultToken.data.default_ticker,
    })
  }

  // else render embed to show multiple results
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
        description: `Next time your server members use \`$token info\` with \`${symbol}\`, **${name}** will be the default selection`,
      })(i)
    },
    render: ({ msgOrInteraction: msg, value }) => {
      const [coinId] = value.split("_")
      return composeTokenInfoResponse({ msg, coinId })
    },
    ambiguousResultText: token.toUpperCase(),
    multipleResultText: Object.values(coins)
      .map((c: any) => `**${c.name}** (${c.symbol.toUpperCase()})`)
      .join(", "),
  }
}
