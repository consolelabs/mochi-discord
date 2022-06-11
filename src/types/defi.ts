export type DiscordWalletTransferRequest = {
  sender: string // discordId
  recipients: string[] // can be array of discordIds or addresses
  amount: number
  cryptocurrency: string
  guildId: string
  channelId: string
  opts?: { duration: number; maxEntries: number }
  each?: boolean
  all?: boolean
  token: Token
  transferType: string
}

export type Token = {
  id: number
  address: string
  symbol: string
  chain_id: number
  decimal: number
  discord_bot_supported: boolean
  coin_gecko_id: string
  name: string
}

export type DiscordWalletBalances = {
  balances: { [key: string]: number }
  balances_in_usd: { [key: string]: number }
}

export type Coin = {
  id: string
  name: string
  symbol: string
  market_cap_rank: number
  image: CoinImage
  market_data: MarketData
  tickers: TickerData[]
}

export type TickerData = {
  base: string
  target: string
  last: number
  coinID: string
  target_coin_id: string
}

type MarketData = {
  current_price: { [key: string]: number }
  market_cap: { [key: string]: number }
  price_change_percentage_1h_in_currency: { [key: string]: number }
  price_change_percentage_24h_in_currency: { [key: string]: number }
  price_change_percentage_7d_in_currency: { [key: string]: number }
}

type CoinImage = {
  thumb: string
  small: string
  large: string
}
