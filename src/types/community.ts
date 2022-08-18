import { NFTSymbol } from "./config"
import { User } from "./profile"

export type InviteHistoryInput = {
  guild_id: string
  inviter: string
  invitee: string
}

export type InviteeCountInput = {
  guild_id: string
  inviter: string
}

export type InvitesInput = {
  guild_id: string
  member_id: string
}

export type LeaderboardItem = {
  guild_id: string
  user_id: string
  total_xp: number
  level: number
  user: User
  guild_rank: number
  nr_of_actions: number
  progress: number
}

export type TopNFTTradingVolumeItem = {
  collection_address: string
  collection_name: string
  collection_symbol: string
  collection_chain_id: number
  trading_volume: number
  token: string
}

export type NFTCollectionChain = {
  id: number
  name: string
  currency: string
}

export type NFTCollection = {
  address: string
  name: string
  symbol: string
  chain_id: number
  chain: NFTCollectionChain
  erc_format: string
  supply: number
  is_rarity_calculated: boolean
  image: string
}

export type NFTMetadataAttrIcon = {
  id: number
  trait_type: string
  discord_icon: string
  unicode_icon: string
}

export type NFTDetail = {
  suggestions?: Array<NFTSymbol>
  default_symbol: NFTSymbol | null
}
