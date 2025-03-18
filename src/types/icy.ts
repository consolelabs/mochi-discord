export interface IcyInfoResponse {
  data: {
    circulated_icy_balance: string
    icy_satoshi_rate: string
    icy_usd_rate: string
    min_icy_to_swap: string
    min_satoshi_fee: string
    satoshi_balance: string
    satoshi_per_usd: number
    satoshi_usd_rate: string
    service_fee_rate: number
  }
  message: string
}
