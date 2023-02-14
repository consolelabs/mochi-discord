export type Guilds = {
  data: Guild[]
}

export type Guild = {
  id: string
  name: string
  bot_scopes: string[]
  alias: string
  log_channel_id: string
  log_channel: string
  global_xp: boolean
}

export type NFTSymbol = {
  name: string
  symbol: string
  address: string
  chain: string
}

export type Role = {
  id: string
  name: string
  reaction: string
}
export type ReactionRoleResponse = {
  guild_id: string
  message_id: string
  role: Role
}

export type RoleReactionEvent = {
  guild_id: string
  message_id: string
  reaction: string
  role_id?: string
  channel_id: string
}

export type RoleReactionConfigResponse = {
  guild_id: string
  message_id: string
  roles: Role[]
  success: boolean
}

export type ReactionRoleListConfigItem = {
  role: string
  emoji?: string
}

export type ReactionRoleListConfigGroup = {
  url: string
  title: string
  values: ReactionRoleListConfigItem[]
}

export type ReactionRoleListPaginated = {
  totalPage: number
  items: Map<number, ReactionRoleListConfigGroup[]>
}

export type CreateMixRoleConfigRequest = {
  guild_id: string
  role_id: string
  required_level: number
  nft_requirement?: {
    nft_id: string
    amount: number
  }
  token_requirement?: {
    token_id: number
    amount: number
  }
}
