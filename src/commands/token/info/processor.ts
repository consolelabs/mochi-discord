import defi from "adapters/defi"
import { CommandInteraction, HexColorString } from "discord.js"
import { InternalError } from "errors"
import CacheManager from "cache/node-cache"
import { getChartColorConfig } from "ui/canvas/color"
import { composeEmbedMessage } from "ui/discord/embed"
import { formatDigit } from "../../../utils/defi"
// @ts-ignore
import { ResponseCoinGeckoInfoKeyValue } from "../../../types/api"
import { Coin } from "types/defi"
import { getEmoji } from "utils/common"

const CURRENCY = "usd"

export function composeTokenInfoEmbed({ coin }: { coin: Coin }) {
  const embed = composeEmbedMessage(null, {
    thumbnail: coin.image.large,
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    title: "About " + coin.name,
  })

  // @ts-ignore
  const content = coin.coingecko_info.description_lines[0]

  embed.setDescription(content || "This token has not updated description yet")

  if (coin.market_data?.circulating_supply) {
    embed.addFields({
      name: "Circulating",
      value: `${formatDigit({
        value: coin.market_data?.circulating_supply,
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (coin.market_data?.total_supply) {
    embed.addFields({
      name: "Total Supply",
      value: `${formatDigit({
        value: coin.market_data.total_supply,
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (coin.market_data?.max_supply) {
    embed.addFields({
      name: "Max Supply",
      value: `${formatDigit({
        value: coin.market_data.max_supply,
        shorten: true,
      })}`,
      inline: true,
    })
  }

  if (coin.market_data?.fully_diluted_valuation?.[CURRENCY]) {
    embed.addFields({
      name: "FDV",
      value: `$${formatDigit({
        value: coin.market_data.fully_diluted_valuation?.[CURRENCY],
        shorten: true,
      })}`,
      inline: true,
    })
  }

  embed.addFields({
    name: "Tags",
    // only get items that contain "Ecosystem" and remove the word "Ecosystem"
    value: coin.categories.join(", "),
    inline: true,
  })

  // @ts-ignore
  if (coin.coingecko_info?.explorers) {
    embed.addFields({
      name: "Addresses",
      // hyper link the key and value: coin.coingecko_info.explorers
      // @ts-ignore
      value: coin.coingecko_info.explorers
        .map(
          (explorer: ResponseCoinGeckoInfoKeyValue) =>
            `[${explorer.key}](${explorer.value})`
        )
        .join(", "),
      inline: true,
    })
  }

  return embed
}

export async function handleTokenInfo(
  interaction: CommandInteraction,
  symbol: string
) {
  const { data: coins } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-search-${symbol}`,
    call: () => defi.searchCoins(symbol),
  })
  if (!coins || !coins.length) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      msgOrInteraction: interaction,
      descriptions: [
        "Please choose a token that is listed on [CoinGecko](https://www.coingecko.com)",
        "Or choose a valid fiat currency.",
      ],
      reason: `**${symbol.toUpperCase()}** is invalid or hasn't been supported.`,
    })
  }

  let coin = coins.find((coin: any) => coin.most_popular)
  if (!coin) {
    coin = coins.at(0)
  }

  const { data, status } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coin.id}`,
    call: () => defi.getCoin(coin.id, false),
  })

  if (status === 404) {
    throw new InternalError({
      title: "Unsupported token",
      msgOrInteraction: interaction,
      description: `Token is invalid or hasn't been supported.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} or Please choose a valid fiat currency.`,
    })
  }

  return {
    msgOpts: {
      embeds: [composeTokenInfoEmbed({ coin: data })],
    },
  }
}
