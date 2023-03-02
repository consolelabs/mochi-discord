import defi from "adapters/defi"
import { APIError, InternalError } from "errors"
import CacheManager from "cache/node-cache"
import { getEmoji } from "utils/common"
import { composeTickerResponse } from "./processor"
import config from "adapters/config"
import { getDefaultSetter } from "utils/default-setters"
import { Message } from "discord.js"
import { TextCommandResponse } from "types/common"

async function run(msg: Message, base: string): Promise<TextCommandResponse> {
  const {
    ok,
    data: coins,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-search-${base}`,
    call: () => defi.searchCoins(base),
  })
  if (!ok) throw new APIError({ message: msg, curl, description: log })
  if (!coins || !coins.length) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      message: msg,
      description: `**${base.toUpperCase()}** is invalid or hasn't been supported.\n${getEmoji(
        "POINTINGRIGHT"
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "POINTINGRIGHT"
      )} or Please choose a valid fiat currency.`,
    })
  }

  if (coins.length === 1) {
    return await composeTickerResponse({
      coinId: coins[0].id,
      discordId: msg.author.id,
      symbol: base,
    })
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
      coinId: defaultTicker.data.default_ticker,
      discordId: msg.author.id,
      symbol: base,
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
        description: `Next time your server members use \`$ticker\` with \`${symbol}\`, **${name}** will be the default selection.`,
      })(i)
    },
    render: ({ msgOrInteraction: msg, value }) => {
      const [coinId] = value.split("_")
      return composeTickerResponse({
        coinId,
        discordId: msg.author.id,
        symbol: base,
      })
    },
    ambiguousResultText: base.toUpperCase(),
    multipleResultText: Object.values(coins)
      .map((c: any) => `**${c.name}** (${c.symbol.toUpperCase()})`)
      .join(", "),
  }
}

export default run
