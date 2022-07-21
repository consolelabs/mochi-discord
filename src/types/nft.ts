export type NftTickers = {
  timestamps: number[]
  prices: NftPrice[]
  times: string[]
}

export type NftCollectionTicker = {
  tickers?: NftTickers
  floor_price?: NftPrice
  name: string
  address: string
  chain: string
  marketplaces: string[]
  total_volume?: NftPrice
  items: number
  owners: number
  collection_image: string
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
