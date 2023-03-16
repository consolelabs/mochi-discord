import { FTMSCAN_API_KEY } from "env"
import fetch from "node-fetch"
import {
  RequestCreateAssignContract,
  RequestCreateTipConfigNotify,
  RequestOffchainTransferRequest,
  RequestOffchainWithdrawRequest,
  ResponseGetNftWatchlistResponse,
  ResponseGetSupportedTokenResponse,
  ResponseGetUserBalancesResponse,
  ResponseNftWatchlistSuggestResponse,
} from "types/api"
import {
  Coin,
  CoinComparisionData,
  CoinPrice,
  GasPriceData,
  Token,
} from "types/defi"
import {
  API_BASE_URL,
  BSCSCAN_API,
  ETHSCAN_API,
  FTMSCAN_API,
  POLYGONSCAN_API,
} from "utils/constants"
import { Fetcher } from "./fetcher"

class Defi extends Fetcher {
  public async getSupportedTokens(): Promise<Token[]> {
    const resp = await fetch(`${API_BASE_URL}/defi/tokens`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (resp.status !== 200) {
      throw new Error("Error while fetching supported tokens data")
    }

    const json = await resp.json()
    if (json.error !== undefined) {
      throw new Error(json.error)
    }
    return json.data
  }

  public async getSupportedToken(query: { address: string; chain: string }) {
    return await this.jsonFetch<ResponseGetSupportedTokenResponse>(
      `${API_BASE_URL}/defi/token`,
      { query }
    )
  }

  public async getCoin(id: string) {
    return await this.jsonFetch<Coin>(`${API_BASE_URL}/defi/coins/${id}`)
  }

  public async getBinanceCoinPrice(symbol: string) {
    return await this.jsonFetch<CoinPrice>(
      `${API_BASE_URL}/defi/coins/binance/${symbol}`
    )
  }

  public async searchCoins(query: string) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/coins?query=${query}`)
  }

  async getHistoricalMarketData({
    coinId,
    currency,
    days = 30,
    discordId,
  }: {
    coinId: string
    currency: string
    days?: number
    discordId?: string
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
    return await this.jsonFetch(`${API_BASE_URL}/defi/watchlist`, {
      query: {
        userId,
        page,
        size,
        coinGeckoId,
      },
    })
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
      bsc: BSCSCAN_API,
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

  async offchainTipBotAssignContract(req: RequestCreateAssignContract) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/assign-contract`, {
      method: "POST",
      body: req,
    })
  }

  async offchainGetUserBalances(query: { userId: string }) {
    return await this.jsonFetch<ResponseGetUserBalancesResponse>(
      `${API_BASE_URL}/tip/balances`,
      { method: "GET", query }
    )
  }

  async offchainDiscordTransfer(req: RequestOffchainTransferRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/transfer`, {
      method: "POST",
      body: req,
    })
  }

  async offchainDiscordWithdraw(req: RequestOffchainWithdrawRequest) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/withdraw`, {
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

  async getAllTipBotTokens() {
    return await this.jsonFetch(`${API_BASE_URL}/tip/tokens`)
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

  async getUserOwnedWallets(userId: string, guildId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/users/${userId}/wallets`, {
      query: { guildId },
    })
  }

  async getUserTrackingWallets(userId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/tracking`
    )
  }

  async findWallet(userId: string, query: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${query}`
    )
  }

  async getWalletAssets(userId: string, address: string, type: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/${type}/assets`
    )
  }

  async getWalletTxns(userId: string, address: string, type: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/${type}/txns`
    )
  }

  async trackWallet(body: {
    userId: string
    address: string
    alias: string
    type?: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${body.userId}/wallets/track`,
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

  async requestSupportToken(body: {
    user_discord_id: string
    channel_id: string
    message_id: string
    token_name: string
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
}

export default new Defi()
