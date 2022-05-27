import { Guild } from "./config"

export type User = {
  id: string
  username: string
  in_discord_wallet_number: number
  in_discord_wallet_address: string
}

type UserXps = {
  nobility_xp: number
  fame_xp: number
  loyalty_xp: number
  reputation_xp: number
}

export type PodTownUser = {
  address: string
  discord_id: string
  twitter_id: string
  twitter_handle: string
  twitter_name: string
  referral_code: string
  is_verified: boolean
  number_of_tokens: number
  in_discord_wallet_number: number
  in_discord_wallet_address: string
  xps: UserXps
  ens_record: string
  nom_record: string
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
  progress: number
  guild: Guild
}
