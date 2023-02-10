import { CommandInteraction, Message } from "discord.js"
import { FTMSCAN_API_KEY } from "env"
import { APIError } from "errors"
import fetch from "node-fetch"
import {
  RequestCreateAssignContract,
  RequestCreateTipConfigNotify,
  RequestOffchainTransferRequest,
  RequestOffchainWithdrawRequest,
  ResponseGetNftWatchlistResponse,
  ResponseNftWatchlistSuggestResponse,
} from "types/api"
import { Coin, CoinComparisionData, GasPriceData, Token } from "types/defi"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, roundFloatNumber } from "utils/common"
import {
  API_BASE_URL,
  BSCSCAN_API,
  ETHSCAN_API,
  FTMSCAN_API,
  POLYGONSCAN_API,
} from "utils/constants"
import { Fetcher } from "./fetcher"

class Defi extends Fetcher {
  public async getInsuffientBalanceEmbed(
    msg: Message | CommandInteraction,
    userId: string,
    token: string,
    amount: number,
    isAll: boolean
  ) {
    // check balance
    const { ok, data, curl, error } = await this.offchainGetUserBalances({
      userId,
    })
    if (!ok) {
      throw new APIError({ message: msg, curl: curl, error: error })
    }
    let currentBal = 0
    data?.forEach((bal: any) => {
      if (token.toUpperCase() === bal.symbol.toUpperCase()) {
        currentBal = bal.balances
      }
    })
    if (currentBal < amount && !isAll) {
      return this.composeInsufficientBalanceEmbed(
        msg,
        currentBal,
        amount,
        token
      )
    }
    return null
  }

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

  public async getCoin(id: string) {
    return await this.jsonFetch<Coin>(`${API_BASE_URL}/defi/coins/${id}`)
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

  public composeInsufficientBalanceEmbed(
    msgOrInteraction: Message | CommandInteraction,
    current: number,
    required: number,
    cryptocurrency: string
  ) {
    const tokenEmoji = getEmoji(cryptocurrency)
    const symbol = cryptocurrency.toUpperCase()
    const authorId =
      msgOrInteraction instanceof Message
        ? msgOrInteraction.author.id
        : msgOrInteraction.user.id
    return composeEmbedMessage(null, {
      author: ["Insufficient balance", getEmojiURL(emojis.REVOKE)],
      description: `<@${authorId}>, your balance is insufficient.\nYou can deposit more by using \`$deposit ${cryptocurrency}\``,
    })
      .addField(
        "Required amount",
        `${tokenEmoji} ${roundFloatNumber(required, 4)} ${symbol}`,
        true
      )
      .addField(
        "Your balance",
        `${tokenEmoji} ${roundFloatNumber(current, 4)} ${symbol}`,
        true
      )
  }

  async getUserWatchlist({
    userId,
    page = 0,
    size = 5,
  }: {
    userId: string
    page?: number
    size?: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/defi/watchlist`, {
      query: {
        userId,
        page,
        size,
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
    return await this.jsonFetch(`${API_BASE_URL}/tip/balances`, {
      method: "GET",
      query,
    })
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

  async getUserWalletWatchlist(userId: string) {
    return await this.jsonFetch(`${API_BASE_URL}/users/${userId}/wallets`)
  }

  async findWallet(userId: string, query: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${query}`
    )
  }

  async getWalletAssets(userId: string, address: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/assets`
    )
  }

  async getWalletTxns(userId: string, address: string) {
    return await this.jsonFetch(
      `${API_BASE_URL}/users/${userId}/wallets/${address}/txns`
    )
  }

  async trackWallet(body: { userId: string; address: string; alias: string }) {
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
}

export default new Defi()
