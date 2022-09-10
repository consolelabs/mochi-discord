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

export type CustomCommand = {
  id: string
  guild_id: string
  description: string
  actions: any
  enabled: boolean
  cooldown: number
  cooldown_duration: number
  roles_permissions: any
  channels_permissions: any
}
