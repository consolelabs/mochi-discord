import { ResponseInvestPlatforms } from "./api"

export type getKrystalEarnPortfolioResponse = {
  data: InvestBalance[]
}

export type InvestBalance = {
  apy: number
  chain_id: number
  platform: ResponseInvestPlatforms
  ratio: number
  reward_apy: number
  staking_token: {
    address: string
    balance: string
    decimals: number
    logo: string
    name: string
    symbol: string
  }
  to_underlying_token: {
    address: string
    balance: string
    decimals: number
    logo: string
    name: string
    symbol: string
  }
  underlying_usd: number
}
