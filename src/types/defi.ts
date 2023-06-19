import { ResponseGetCoinResponse } from "./api"
import { RequiredDeep } from "type-fest"

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
  token: Token | null
  transferType: string
}

export type OffchainTipBotTransferRequest = {
  sender: string // discordId
  recipients: string[] // can be array of discordIds or addresses
  guildId: string
  channelId: string
  amount: number
  token: string
  each?: boolean
  all?: boolean
  transferType: string
  duration: number
  fullCommand: string
  opts?: { duration: number; maxEntries: number }
  image?: string
  message?: string
}

export type OffchainTipBotWithdrawRequest = {
  recipient: string // withdraw's discordID
  recipientAddress: string // withdraw's address
  guildId: string
  channelId: string
  amount: number
  token: string
  each?: boolean
  all?: boolean
  transferType: string
  duration: number
  fullCommand: string
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
  chain: Chain
}

export type DiscordWalletBalances = {
  balances: { [key: string]: number }
  balances_in_usd: { [key: string]: number }
}

export type Coin = RequiredDeep<ResponseGetCoinResponse>

export type CoinPrice = {
  symbol: string
  price: string
}

export type TickerData = {
  base: string
  target: string
  last: number
  coinID: string
  target_coin_id: string
}

export type CoinComparisionData = {
  times: string[]
  ratios: number[]
  base_coin: Coin
  target_coin: Coin
  base_coin_suggestions: Coin[]
  target_coin_suggestions: Coin[]
  from: string
  to: string
}

export type CoinMarketItem = {
  id: string
  name: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
  sparkline_in_7d: { price: number[] }
}

export type GasPriceData = {
  LastBlock: string
  SafeGasPrice: string
  ProposeGasPrice: string
  FastGasPrice: string
}

export type UserBalances = {
  id: string
  name: string
  symbol: string
  balances: number
  balances_in_usd: number
}

export type Chain = {
  id: string
  chain_id: string
  name: string
  symbol: string
  rpc: string
  explorer: string
  icon: string
  is_evm: boolean
}
