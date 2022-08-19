import { Guild } from "./config"

export type User = {
  id: string
  username: string
  in_discord_wallet_number: number
  in_discord_wallet_address: string
}

export type UserXps = {
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
  guild_rank: number
  user_wallet: UserWallet
}

export type UserWallet = {
  user_discord_id: string
  guild_id: string
  address: string
  chain_type: string
}

export type GetUserNFTResponse = {
  page: number
  size: number
  sort: string
  total: number
  data: UserNFT[]
}

export type UserNFT = {
  token_id: string
  collection_address: string
  name: string | null
  description: string | null
  amount: string | null
  image: string
  image_cdn: string | null
  thumbnail_cdn: string | null
  rarity_rank: number | null
  rarity_score: string | null
  rarity_tier: string | null
  is_self_hosted: boolean
  attributes: UserNFTAttribute[] | null
  rarity: UserNFTRarity | null
}

type UserNFTAttribute = {
  trait_type: string
  value: string
  count: number
  rarity: string
  frequency: string
}

type UserNFTRarity = {
  rank: number
  score: string
  total: number
  rarity: string
}

export type GetUserNFTCollectionResponse = {
  page: number
  size: number
  sort: string
  total: number
  data: UserNFTCollection[]
}

export type UserNFTCollection = {
  id: number
  collection_address: string
  name: string
  symbol: string
  chain_id: number
  erc_format: string | null
  supply: number
  is_rariry_calculated: boolean
  image: string
  description: string
  contract_scan: string
  discord: string
  twitter: string
  website: string
  owners: number
}

export type NFTMetadataAttrIcon = {
  id: number
  trait_type: string
  discord_icon: string
  unicode_icon: string
}
