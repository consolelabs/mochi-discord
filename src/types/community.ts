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

export type TopNFTItem = {
  collection_address: string
  collection_name: string
  symbol: string
  chain_id: string
  trading_volume: {
    nr_of_buy: number
    nr_of_sell: number
  }
}
