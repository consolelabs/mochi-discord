import CacheManager from "cache/node-cache"
import defi from "../adapters/defi"

export function convertString(
  amount: string,
  decimals: number,
  toBigint?: boolean
) {
  if (!decimals || !amount) return 0
  return toBigint
    ? +amount * Math.pow(10, decimals)
    : +amount / Math.pow(10, decimals)
}

export async function convertToUsdValue(amount: number, token: string) {
  const data = await CacheManager.get({
    pool: "ticker",
    key: `ticker-search-${token.toLowerCase()}`,
    call: () => defi.searchCoins(token.toLowerCase()),
  })
  const coins = data?.data
  if (coins == undefined) {
    return "0"
  }
  if (!coins || !coins.length) {
    return "0"
  }
  let coinId = ""
  if (coins.length > 0) {
    coinId = coins[0].id
  }

  const { ok, data: coin } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId),
  })
  if (!ok) {
    return "0"
  }

  const currency = "usd"
  const { current_price } = coin.market_data
  const currentPrice = +current_price[currency]
  const priceNumber = currentPrice * amount
  return parseFloat(priceNumber.toString()).toFixed(3)
}
