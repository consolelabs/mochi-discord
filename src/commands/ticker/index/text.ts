import config from "adapters/config"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { TextCommandResponse } from "types/common"
import { getEmoji } from "utils/common"
import { getDefaultSetter } from "utils/default-setters"
import { composeTickerResponse } from "./processor"

async function run(msg: Message, base: string): Promise<TextCommandResponse> {
  let coins
  if (["btcd", "btc.d"].includes(base.toLowerCase())) {
    coins = [{ id: "btc.d" }]
  } else {
    const { ok, data, log, curl } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${base}`,
      call: () => defi.searchCoins(base),
    })
    if (!ok)
      throw new APIError({ msgOrInteraction: msg, curl, description: log })
    coins = data
  }
  if (!coins || !coins.length) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      msgOrInteraction: msg,
      description: `**${base.toUpperCase()}** is invalid or hasn't been supported.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} or Please choose a valid fiat currency.`,
    })
  }

  if (coins.length === 1) {
    return await composeTickerResponse({
      msgOrInteraction: msg,
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
      msgOrInteraction: msg,
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
        msgOrInteraction: msg,
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
