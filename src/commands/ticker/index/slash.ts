import config from "adapters/config"
import defi from "adapters/defi"
import { CommandInteraction } from "discord.js"
import { APIError, InternalError } from "errors"
import CacheManager from "cache/node-cache"
import { getDefaultSetter } from "utils/default-setters"
import { defaultEmojis } from "utils/common"
import { SlashCommandResponse } from "types/common"
import { composeTickerResponse } from "./processor"

async function run(
  interaction: CommandInteraction,
  baseQ: string
): Promise<SlashCommandResponse> {
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
      title: "Unsupported token/fiat",
      message: interaction,
      description: `Token is invalid or hasn't been supported.\n${defaultEmojis.POINT_RIGHT} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${defaultEmojis.POINT_RIGHT} or Please choose a valid fiat currency.`,
    })
  }

  if (coins.length === 1) {
    return await composeTickerResponse({
      coinId: coins[0].id,
      msg: interaction,
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
      msg: interaction,
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
        msg: interaction,
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
}

export default run
