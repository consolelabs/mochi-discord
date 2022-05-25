export type User = {
  discord_id: string
  referral_code: string
  in_discord_wallet_number: number
  in_discord_wallet_address: string
}

export type Balance = {
  token_address: string
  token_name: string
  balance: number
  pool_name: string
  balance_usd: number
}

export type UserBalance = {
  discord_id: string
  address: string
  total_balance: number
  total_balance_usd: number
  balances: Array<Balance>
}

export type UserInput = {
  id: string
  username: string
  guild_id: string
}

type LevelConfig = {
  level: number
  min_xp: number
}

export type UserProfile = {
  id: string
  current_level: LevelConfig
  next_level: LevelConfig
  guild_xp: number
  nr_of_actions: number
  about_me: string
}
