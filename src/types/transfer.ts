type TransferType = "transfer" | "airdrop"

export type TransferPayload = {
  sender: string
  targets?: string[]
  recipients: string[]
  platform?: "discord"
  guild_id: string
  channel_id: string
  amount: number
  token: string
  token_id?: string
  each?: boolean
  all?: boolean
  transfer_type: TransferType
  message?: string
  image?: string
  chain_id: string
  amount_string?: string
  token_price?: number
  decimal?: number
  moniker?: string
  original_amount?: number
  channel_name: string
  channel_url?: string
  channel_avatar?: any
}

export type AirdropOptions = {
  useQR: boolean
  duration: number
  entries?: number | null
  // data for displaying
  authorName?: string
  endTime?: Date
}
