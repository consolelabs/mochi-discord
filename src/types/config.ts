export type Guilds = {
  data: Guild[]
}

export type Guild = {
  id: string
  name: string
  bot_scopes: string[]
  alias: string
  log_channel_id: string
  global_xp: boolean
}

export type DefaultTicker = {
  guild_id: string
  query: string
  default_ticker: string
}
