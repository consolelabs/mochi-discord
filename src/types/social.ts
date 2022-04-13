export type DiscordWalletTransferRequest = {
  fromDiscordId: string
  toDiscordIds: string[]
  amount: number
  cryptocurrency: string
  guildID: string
  channelID: string
  opts?: { duration: number; maxEntries: number }
  each?: boolean
}

export type DiscordWalletWithdrawRequest = {
  fromDiscordId: string
  toAddress: string
  amount: number
  cryptocurrency: string
  guildID: string
  channelID: string
}

export type Currency = {
  id: number
  address: string
  symbol: string
  chain_id: number
  decimal: number
  discord_bot_supported: boolean
}

export type DiscordWalletBalances = {
  balances: { [key: string]: number }
  balances_in_usd: { [key: string]: number }
}
