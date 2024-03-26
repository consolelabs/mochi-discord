import { FTMSCAN_API_KEY, MOCHI_BOT_SECRET } from "env"
import fetch from "node-fetch"
import {
  RequestCreateTipConfigNotify,
  RequestOffchainTransferRequest,
  ResponseGetNftWatchlistResponse,
  ResponseGetSupportedTokenResponse,
  ResponseGetTrackingWalletsResponse,
  ResponseGetWatchlistResponse,
  ResponseListMyGuildsResponse,
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
      { query },
    )
  }

  public async getCoin(id: string, isDominanceChart = false, chain?: string) {
    return await this.jsonFetch<Coin>(`${API_BASE_URL}/defi/coins/${id}`, {
      query: { isDominanceChart, chain },
    })
  }

  public async getBinanceCoinPrice(symbol: string) {
    return await this.jsonFetch<CoinPrice>(
      `${API_BASE_URL}/defi/coins/binance/${symbol}`,
    )
  }

  public async searchCoins(query: string, chain?: string, guildId?: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/coins?query=${query}&chain=${chain}&guild_id=${guildId}`,
    )
  }

  public async getTokenInfo(tokenId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/tokens/info/${tokenId}`)
  }

  public async searchDexPairs(query: string) {
    return await this.jsonFetch(`${API_BASE_URL}/dexes/search?query=${query}`)
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
    days: number,
  ) {
    return await this.jsonFetch<CoinComparisionData>(
      `${API_BASE_URL}/defi/coins/compare?base=${baseQ}&target=${targetQ}&guild_id=${guildId}&interval=${days}`,
    )
  }

  async getUserWatchlist({
    profileId,
    coinGeckoId,
  }: {
    profileId: string
    coinGeckoId?: string
  }) {
    return await this.jsonFetch<ResponseGetWatchlistResponse>(
      `${API_BASE_URL}/users/${profileId}/watchlists/tokens`,
      {
        query: { coinGeckoId },
      },
    )
  }

  async trackToken(body: {
    profile_id: string
    symbol: string
    coin_gecko_id?: string
    is_fiat: boolean
  }) {
    return await this.jsonFetch<{ suggestion: Coin[] }>(
      `${API_BASE_URL}/users/${body.profile_id}/watchlists/tokens/track`,
      {
        method: "POST",
        body,
      },
    )
  }

  async untrackToken(body: { profileId: string; symbol: string }) {
    return await this.jsonFetch<{ suggestion: Coin[] }>(
      `${API_BASE_URL}/users/${body.profileId}/watchlists/tokens/untrack`,
      {
        method: "POST",
        body,
      },
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
    }).catch(() => null)
  }

  async getUserNFTWatchlist({
    profileId,
    page = 0,
    size = 5,
  }: {
    profileId: string
    page?: number
    size?: number
  }) {
    return await this.jsonFetch<ResponseGetNftWatchlistResponse>(
      `${API_BASE_URL}/users/${profileId}/watchlists/nfts`,
      { query: { page, size } },
    )
  }

  async trackNFT(body: {
    profile_id: string
    collection_symbol: string
    collection_address?: string
    chain?: string
  }) {
    return await this.jsonFetch<ResponseNftWatchlistSuggestResponse>(
      `${API_BASE_URL}/users/${body.profile_id}/watchlists/nfts/track`,
      {
        method: "POST",
        body,
      },
    )
  }

  async untrackNFT(body: { profileId: string; symbol: string }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${body.profileId}/watchlists/nfts/untrack`,
      {
        method: "POST",
        body,
      },
    )
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
    days: number
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/fiat/historical-exchange-rates`,
      {
        query,
      },
    )
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
      },
    )
  }

  async getListConfigNofityTransaction(query: { guild_id: string }) {
    return await this.jsonFetch(`${API_BASE_URL}/config-channels/tip-notify`, {
      query,
    })
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
      `${API_BASE_URL}/users/${userId}/watchlists/wallets`,
    )
  }

  async findWallet(profileId: string, query: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${profileId}/wallets/${query}`,
    )
  }

  async getWalletAssets(userId: string, address: string, type: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/${type.toLowerCase()}/assets`,
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
      `${API_BASE_URL}/users/${profileId}/dexs/${platform}/assets`,
    )
  }

  async getWalletTxns(userId: string, address: string, type: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/${type.toLowerCase()}/txns`,
    )
  }

  async getDexTxns(userId: string, platform: string) {
    // TODO: remove after we support another dex
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    platform = "binance"

    // TODO: implement later
    return {
      ok: true,
    }
  }

  async trackWallet(body: {
    profileId: string
    address: string
    alias: string
    chainType: string
    type: string
  }) {
    body.type = body.type || "track"
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${body.profileId}/watchlists/wallets/track`,
      {
        method: "POST",
        body,
      },
    )
  }

  async updateTrackingWalletInfo(body: {
    profileId: string
    wallet: string
    alias: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${body.profileId}/watchlists/wallets/${body.wallet}`,
      {
        method: "PUT",
        body,
      },
    )
  }

  async untrackWallet(body: {
    profileId: string
    address: string
    alias: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${body.profileId}/watchlists/wallets/untrack`,
      {
        method: "POST",
        body,
      },
    )
  }

  async generateWalletVerification(req: {
    userId: string
    channelId: string
    messageId: string
  }) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${req.userId}/wallets/generate-verification`,
      { method: "POST", body: req },
    )
  }

  async getAlertList(userId: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/price-alert?user_discord_id=${userId}`,
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
      },
    )
  }

  async getUserSupportTokens(page: number, size = 0) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/tokens?page=${page}&size=${size}`,
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
      },
    )
  }

  async rejectTokenSupport(requestId: number) {
    return await this.jsonFetch(
      `${API_BASE_URL}/defi/token-support/${requestId}/reject`,
      {
        method: "PUT",
      },
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
    profileId,
  }: {
    from: string
    to: string
    amount: string
    profileId: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/swap/route`, {
      queryCamelToSnake: false,
      query: {
        from,
        to,
        amount,
        profileId,
      },
    })
  }

  async swap(
    userDiscordId: string,
    chainName: string,
    aggregator: string,
    swapData: any,
  ) {
    return await this.jsonFetch(`${API_BASE_URL}/swap`, {
      method: "POST",
      body: {
        userDiscordId,
        aggregator,
        swapData,
        chainName,
      },
      bodyCamelToSnake: false,
    })
  }

  async getTrendingSearch() {
    return await this.jsonFetch(`${API_BASE_URL}/defi/trending`)
  }

  public async getAllBalances({ profileId }: { profileId: string }) {
    const url = `${API_BASE_URL}/users/${profileId}/balances`
    return await this.jsonFetch(url)
  }

  async transferV2(req: any) {
    return await this.jsonFetch(`${API_BASE_URL}/tip/transfer-v2`, {
      method: "POST",
      body: req,
      headers: {
        Authorization: `Bearer ${MOCHI_BOT_SECRET}`,
      },
    })
  }

  async searchDexScreenerPairs(query: {
    token_address: string
    symbol: string
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/dexes/dex-screener/search`, {
      query,
    })
  }
}

export default new Defi()
