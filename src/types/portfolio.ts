export type Token = {
  amount: number
  chain: string
  decimals: number
  display_symbol: string
  id: string
  is_core: boolean
  is_verfified: boolean
  is_wallet: boolean
  logo_url: string
  name: string
  optimized_symbol: string
  price: number
  protocol_id: string
  symbol: string
  time_at: number
}

export type SupplyToken = Token

export type BorrowToken = Token

export type RewardToken = Token

export type PortfolioItem = {
  name: string
  stats: {
    asset_usd_value: number
    daily_cost_usd_value: number
    daily_net_yield_usd_value: number
    daily_yield_usd_value: number
    debt_usd_value: number
    net_usd_value: number
  }
  updated_at: number
  detail_types: string[]
  detail: {
    token_list?: Array<Token>
    supply_token_list?: Array<SupplyToken>
    reward_token_list?: Array<RewardToken>
    borrow_token_list?: Array<BorrowToken>
    debt_ratio: number | null
    health_rate: number | null
    collateral_rate: number | null
    unlock_at: number | null
    end_at: number | null
    token: Token
  }
}

export type PortfolioSummary = {
  name: string
  logo_url: string
  site_url: string
  chain: string
  portfolio_list: Array<PortfolioItem>
}

export type ChainList = {
  community_id: number
  id: string
  logo_url: string
  name: string
  native_token_id: string
  usd_value: number
  wrapped_token_id: string
}

export type PortfolioResponse = {
  balance: {
    total_usd_value: number
    chain_list: Array<ChainList>
  }
  data: Array<PortfolioSummary>
  user_address: string
}

export type Portfolio = PortfolioResponse & {
  asset: {
    chain: string
    amount_usd_value: number
    percentage: number
  }[]
}
