type TransferType = "tip" | "airdrop"

export type TransferPayload = {
  sender: string
  targets?: string[]
  recipients: string[]
  platform?: "discord"
  guild_id: string
  channel_id: string
  float_amount: number
  total_amount: string
  each_amount: string
  token: string
  each?: boolean
  all?: boolean
  transfer_type: TransferType
  message?: string
  image?: string
  chain_id: string
  usd_amount?: number
  total_amount_string?: string
  token_price?: number
}

export type AirdropOptions = { duration: number; entries?: number | null }
