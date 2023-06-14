import { FTMSCAN_API_KEY } from "env"
import fetch from "node-fetch"
import {
  RequestCreateTipConfigNotify,
  RequestOffchainTransferRequest,
  ResponseGetNftWatchlistResponse,
  ResponseGetSupportedTokenResponse,
  ResponseGetTrackingWalletsResponse,
  ResponseGetWatchlistResponse,
  ResponseNftWatchlistSuggestResponse,
} from "types/api"
import { Coin, CoinComparisionData, CoinPrice, GasPriceData } from "types/defi"
import {
  API_BASE_URL,
  BSCSCAN_API,
  ETHSCAN_API,
  FTMSCAN_API,
  INDEXER_API_BASE_URL,
  POLYGONSCAN_API,
} from "utils/constants"
import { Fetcher } from "./fetcher"

class Defi extends Fetcher {
  public async getSupportedToken(query: { address: string; chain: string }) {
    return await this.jsonFetch<ResponseGetSupportedTokenResponse>(
      `${API_BASE_URL}/defi/token`,
      { query }
    )
  }

  public async getCoin(id: string, isDominanceChart = false, chain?: string) {
    return await this.jsonFetch<Coin>(`${API_BASE_URL}/defi/coins/${id}`, {
      query: { isDominanceChart, chain },
    })
  }

  public async getBinanceCoinPrice(symbol: string) {
    return await this.jsonFetch<CoinPrice>(
      `${API_BASE_URL}/defi/coins/binance/${symbol}`
    )
  }

  public async searchCoins(query: string, chain?: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/coins?query=${query}&chain=${chain}`
    )
  }

  async getHistoricalMarketData({
    coinId,
    currency,
    days = 30,
    discordId,
    isDominanceChart,
  }: {
    coinId: string
    currency: string
    days?: number
    discordId?: string
    isDominanceChart: boolean
  }) {
    return await this.jsonFetch<{
      times: string[]
      prices: number[]
      from: string
      to: string
    }>(`${API_BASE_URL}/defi/market-chart`, {
      query: {
        coin_id: coinId,
        currency,
        days,
        ...(discordId && { discordId }),
        isDominanceChart,
      },
    })
  }

  async compareToken(
    guildId: string,
    baseQ: string,
    targetQ: string,
    days: number
  ) {
    return await this.jsonFetch<CoinComparisionData>(
      `${API_BASE_URL}/defi/coins/compare?base=${baseQ}&target=${targetQ}&guild_id=${guildId}&interval=${days}`
    )
  }

  async getUserWatchlist({
    userId,
    coinGeckoId,
    page = 0,
    size = 5,
  }: {
    userId: string
    coinGeckoId?: string
    page?: number
    size?: number
  }) {
    return await this.jsonFetch<ResponseGetWatchlistResponse>(
      `${API_BASE_URL}/defi/watchlist`,
      {
        query: {
          userId,
          page,
          size,
          coinGeckoId,
        },
      }
    )
  }

  async addToWatchlist(req: {
    user_id: string
    symbol: string
    coin_gecko_id?: string
    is_fiat: boolean
  }) {
    return await this.jsonFetch<{ suggestion: Coin[] }>(
      `${API_BASE_URL}/defi/watchlist`,
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    )
  }

  async removeFromWatchlist(query: { userId: string; symbol: string }) {
    return await this.jsonFetch<{ suggestion: Coin[] }>(
      `${API_BASE_URL}/defi/watchlist`,
      {
        method: "DELETE",
        query,
      }
    )
  }

  async getGasPrice(chain: string) {
    const gasTrackerUrls: Record<string, string> = {
      ftm: FTMSCAN_API,
      bnb: BSCSCAN_API,
      matic: POLYGONSCAN_API,
      eth: ETHSCAN_API,
    }
    const url = gasTrackerUrls[chain]
    const query = {
      module: "gastracker",
      action: "gasoracle",
    }
    return await this.jsonFetch<{ result: GasPriceData }>(url, {
      query,
      silent: true,
    })
  }

  async getUserNFTWatchlist({
    userId,
    page = 0,
    size = 5,
  }: {
    userId: string
    page?: number
    size?: number
  }) {
    return await this.jsonFetch<ResponseGetNftWatchlistResponse>(
      `${API_BASE_URL}/nfts/watchlist`,
      {
        query: {
          userId,
          page,
          size,
        },
      }
    )
  }

  async addNFTToWatchlist(req: {
    user_id: string
    collection_symbol: string
    collection_address?: string
    chain?: string
  }) {
    return await this.jsonFetch<ResponseNftWatchlistSuggestResponse>(
      `${API_BASE_URL}/nfts/watchlist`,
      {
        method: "POST",
        body: req,
      }
    )
  }

  async removeNFTFromWatchlist(query: { userId: string; symbol: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/nfts/watchlist`, {
      method: "DELETE",
      query,
    })
  }

  async offchainDiscordTransfer(req: RequestOffchainTransferRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/transfer`, {
      method: "POST",
      body: req,
    })
  }

  async getFiatHistoricalData(query: {
    base: string
    target: string
    days?: string
  }) {
    query.days = query.days ?? "30"
    return await this.jsonFetch(
      `${API_BASE_URL}/fiat/historical-exchange-rates`,
      {
        query,
      }
    )
  }

  async getTransactionsHistories(query: {
    sender_id?: string
    receiver_id?: string
    token: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/transactions`, {
      query,
    })
  }

  async createConfigNofityTransaction(req: RequestCreateTipConfigNotify) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/tip-notify`, {
      method: "POST",
      body: req,
    })
  }

  async deleteConfigNofityTransaction(id: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/config-channels/tip-notify/${id}`,
      {
        method: "DELETE",
      }
    )
  }

  async getListConfigNofityTransaction(query: { guild_id: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/tip-notify`, {
      query,
    })
  }

  async submitOnchainTransfer(req: any) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/onchain/submit`, {
      method: "POST",
      body: req,
    })
  }

  async claimOnchainTransfer(req: any) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/onchain/claim`, {
      method: "POST",
      body: req,
    })
  }

  async getUserOnchainTransfers(userId: string, status?: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/tip/onchain/${userId}/transfers`,
      {
        method: "GET",
        query: { status },
      }
    )
  }

  async getUserOnchainBalances(userId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/tip/onchain/${userId}/balances`,
      { method: "GET" }
    )
  }

  async getFtmPrice() {
    const queries = {
      module: "stats",
      action: "ftmprice",
      apikey: FTMSCAN_API_KEY,
    }
    const queryStr = Object.entries(queries)
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
    return await fetch(`${FTMSCAN_API}?${queryStr}`)
  }

  async getUserTrackingWallets(userId: string) {
    return await this.jsonFetch<ResponseGetTrackingWalletsResponse>(
      `${API_BASE_URL}/users/${userId}/watchlists/wallets`
    )
  }

  async findWallet(userId: string, query: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${query}`
    )
  }

  async getWalletAssets(userId: string, address: string, type: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/${type.toLowerCase()}/assets`
    )
  }

  async getDexAssets({
    profileId,
    platform,
  }: {
    profileId: string
    platform: string
  }) {
    // TODO: remove after we support another dex
    platform = "binance"
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${profileId}/dexs/${platform}/assets`
    )
  }

  async getWalletTxns(userId: string, address: string, type: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/${type.toLowerCase()}/txns`
    )
  }

  async getDexTxns(userId: string, platform: string) {
    // TODO: remove after we support another dex
    platform = "binance"

    // TODO: implement later
    return {
      ok: true,
    }

    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/dexs/${platform}/transactions`
    )
  }

  async trackWallet(body: {
    userId: string
    address: string
    alias: string
    chainType: string
    type: string
  }) {
    body.type = body.type || "track"
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${body.userId}/watchlists/wallets/track`,
      {
        method: "POST",
        body,
      }
    )
  }

  async untrackWallet(body: {
    userId: string
    address: string
    alias: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${body.userId}/wallets/untrack`,
      {
        method: "POST",
        body,
      }
    )
  }

  async generateWalletVerification(req: {
    userId: string
    channelId: string
    messageId: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${req.userId}/wallets/generate-verification`,
      { method: "POST", body: req }
    )
  }

  async getAlertList(userId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/price-alert?user_discord_id=${userId}`
    )
  }

  async addAlertPrice(body: {
    userDiscordId: string
    symbol: string
    alertType: string
    frequency: string
    value: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/price-alert`, {
      method: "POST",
      body,
    })
  }

  async removeAlertPrice(alertId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/price-alert?id=${alertId}`,
      {
        method: "DELETE",
      }
    )
  }

  async getUserSupportTokens(page: number, size = 0) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/tokens?page=${page}&size=${size}`
    )
  }

  async requestSupportToken(body: {
    user_discord_id: string
    guild_id: string
    channel_id: string
    message_id: string
    token_address: string
    token_chain: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/token-support`, {
      method: "POST",
      body,
    })
  }

  async approveTokenSupport(requestId: number) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/token-support/${requestId}/approve`,
      {
        method: "PUT",
      }
    )
  }

  async rejectTokenSupport(requestId: number) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/token-support/${requestId}/reject`,
      {
        method: "PUT",
      }
    )
  }

  async getGasTracker() {
    return await this.jsonFetch(`${API_BASE_URL}/defi/gas-tracker`)
  }

  async getChainGasTracker(chain: string) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/gas-tracker/${chain}`)
  }

  async convertToken(body: { from: string; to: string; amount: string }) {
    return await this.jsonFetch(`${INDEXER_API_BASE_URL}/token/convert-price`, {
      method: "POST",
      body,
    })
  }

  async getCoinsMarketData(query: { order?: string } = {}) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/market-data`, {
      query,
    })
  }

  async getAllCoinsMarketData(query: { order?: string } = {}) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/all-market-data`, {
      query,
    })
  }

  async getTopGainerLoser(query: { duration?: string } = {}) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/top-gainer-loser`, {
      query,
    })
  }

  async getSwapRoute({
    from,
    to,
    amount,
    chain_name,
    from_token_id, // not every token exist in kyber api, this is used for backend to query and add token which kyber not have
    to_token_id, // not every token exist in kyber api, this is used for backend to query and add token which kyber not have
  }: {
    from: string
    to: string
    amount: string
    chain_name: string
    from_token_id?: string
    to_token_id?: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/swap/route`, {
      query: {
        from,
        to,
        amount,
        chain_name,
        from_token_id,
        to_token_id,
      },
    })
  }

  async swap(userDiscordId: string, chainName: string, routeSummary: any) {
    return await this.jsonFetch(`${API_BASE_URL}/swap`, {
      method: "POST",
      body: {
        userDiscordId,
        chainName,
        routeSummary,
      },
      bodyCamelToSnake: false,
    })
  }

  async getTrendingSearch() {
    return await this.jsonFetch(`${API_BASE_URL}/defi/trending`)
  }
}

export default new Defi()
