type TransferType = "tip" | "airdrop"

export type TransferPayload = {
  sender: string
  targets?: string[]
  recipients: string[]
  platform?: "discord"
  guild_id: string
  channel_id: string
  amount: number
  token: string
  each?: boolean
  all?: boolean
  transfer_type: TransferType
  message?: string
  image?: string
  chain_id: string
  usd_amount?: number
  amount_string?: string
  token_price?: number
  decimal?: number
}

export type AirdropOptions = { duration: number; entries?: number | null }
