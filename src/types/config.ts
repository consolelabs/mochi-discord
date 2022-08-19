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

export type NFTSymbol = {
  name: string
  symbol: string
  address: string
  chain: string
}
