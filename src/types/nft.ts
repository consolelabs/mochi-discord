export type NftTickers = {
  timestamps: number[]
  prices: NftPrice[]
  times: string[]
}

export type NftCollectionTicker = {
  tickers?: NftTickers
  name: string
  address: string
  chain: Chain
  marketplaces: string[]
  items: number
  owners: number
  collection_image: string
  total_volume?: NftPrice
  floor_price?: NftPrice
  last_sale_price?: NftPrice
}

export type NftPrice = {
  token: IndexerToken
  amount: string
}

export type IndexerToken = {
  symbol: string
  is_native: boolean
  address: string
  decimals: number
}

type Chain = {
  symbol: string
  name: string
  chain_id: number
}
