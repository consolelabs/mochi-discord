export type DiscordWalletTransferRequest = {
  sender: string // discordId
  recipients: string[] // can be array of discordIds or addresses
  amount: number
  cryptocurrency: string
  guildId: string
  channelId: string
  opts?: { duration: number; maxEntries: number }
  each?: boolean
  all?: boolean
  token: Token
}

export type Token = {
  id: number
  address: string
  symbol: string
  chain_id: number
  decimal: number
  discord_bot_supported: boolean
  coin_gecko_id: string
  name: string
}

export type DiscordWalletBalances = {
  balances: { [key: string]: number }
  balances_in_usd: { [key: string]: number }
}
