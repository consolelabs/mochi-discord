import {
  MOCHI_PAY_API_BASE_URL,
  MOCHI_PAY_API_BASE_URL_V2,
} from "utils/constants"
import { Fetcher } from "./fetcher"
import fetch from "node-fetch"
import { getKrystalEarnPortfolioResponse } from "types/mochipay"
import { MOCHI_BOT_SECRET } from "env"

type KrystalStakeRequest = {
  chain_id: number
  profile_id: string
  earning_type: string
  platform: string
  token_amount: string
  token: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
}

type KrystalUnstakeRequest = {
  chain_id: number
  profile_id: string
  earning_type: string
  platform: string
  token_amount: string
  token: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  receipt_token: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
}

class MochiPay extends Fetcher {
  public async getMochiWalletsByProfileId(id: string) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/in-app-wallets/get-by-profile/${id}`,
      {
        method: "POST",
      },
    )
  }

  public async transfer(req: any) {
    const res = await fetch(`${MOCHI_PAY_API_BASE_URL}/transfer`, {
      method: "POST",
      body: JSON.stringify(req),
    })
    if (res.status !== 200) {
      return { status: res.status }
    }
    return {
      status: 200,
      data: await res?.json(),
    }
  }

  public async getPaymentRequestByProfile(
    profileId: string,
    type: string,
  ): Promise<any[]> {
    const { data: res, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/pay-requests?profile_id=${profileId}&type=${type}`,
    )
    let data = []
    if (ok) {
      data = res as any[]
    }
    return data
  }

  public async generatePaymentCode(body: any) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/pay-requests`, {
      method: "POST",
      body: {
        ...body,
        from_platform: "discord",
      },
    })
  }

  public async generateQRpaymentCode(body: {
    profileId: string
    amount: number
    token: string
    entries?: number
    duration: number
    chain_id: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/pay-requests/airdrop`,
      {
        method: "POST",
        body: {
          ...body,
          amount: undefined,
          amount_each: String(body.amount),
        },
      },
    )
  }

  public async getBalances({
    profileId,
    token,
    unique,
  }: {
    profileId: string
    token?: string
    unique?: boolean
  }) {
    const url = `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/${profileId}/balances/${
      token ?? ""
    }`
    return await this.jsonFetch(url, { query: { unique: unique } })
  }

  public async withdraw(body: {
    profileId: string
    token: string
    amount: string
    address: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/withdraw`,
      {
        method: "POST",
        body,
      },
    )
  }

  public async deposit(body: { profileId: string; token: string }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/deposit`,
      {
        method: "POST",
        body: {
          ...body,
          platform: "discord",
        },
      },
    )
  }

  async getTokens(query: { symbol?: string }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/tokens`, {
      query,
    })
  }

  async getListTx(
    profileId: string,
    query: { status?: string; action?: string; page?: number; size?: number },
  ) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profile/${profileId}/transactions`,
      { query },
    )
  }

  async getWithdrawTxns(query: {
    profileId: string
    token: string
    chainId: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/withdraw/transactions/recent`,
      {
        query,
      },
    )
  }

  async getListSwapTx(query: { profile_id: string }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/swap/transactions`, {
      query,
    })
  }

  async getTxByExternalId(external_id: string) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/transfer/${external_id}`,
    )
  }

  async krystalStake(body: KrystalStakeRequest) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/earns/krystal/stake`,
      {
        method: "POST",
        body,
      },
    )
  }

  async krystalUnstake(body: KrystalUnstakeRequest) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/earns/krystal/unstake`,
      {
        method: "POST",
        body,
      },
    )
  }

  async krystalClaimRewards(body: {
    chain_id: number
    profile_id: string
    platform: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/earns/krystal/claim-rewards`,
      {
        method: "POST",
        body,
      },
    )
  }

  async getKrystalEarnPortfolio(query: {
    profile_id: string
    chain_id?: string
    platform?: string
    type?: string
    token_address?: string
  }) {
    return await this.jsonFetch<getKrystalEarnPortfolioResponse>(
      `${MOCHI_PAY_API_BASE_URL}/earns/krystal/earn-balances`,
      {
        query,
      },
    )
  }

  async getKrystalEarnHistory(query: {
    profile_id: string
    size?: number
    page?: number
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/earns/krystal/history`,
      {
        query,
      },
    )
  }

  async approveTransferRequest({
    headers,
    profileId,
    requestCode,
    appId = "1",
  }: {
    headers: Record<string, string>
    profileId: string
    requestCode: string
    appId?: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/applications/${appId}/requests/${requestCode}/approved`,
      {
        method: "POST",
        headers,
      },
    )
  }

  async rejectTransferRequest({
    headers,
    profileId,
    requestCode,
    appId = "1",
  }: {
    headers: Record<string, string>
    profileId: string
    requestCode: string
    appId?: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/applications/${appId}/requests/${requestCode}/rejected`,
      {
        method: "POST",
        headers,
      },
    )
  }

  async getTransferRequestByCode({
    headers,
    requestCode,
    appId = "1",
  }: {
    headers: Record<string, string>
    requestCode: string
    appId?: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/applications/${appId}/requests/${requestCode}`,
      {
        headers,
      },
    )
  }

  public async withdrawV2(body: {
    profileId: string
    tokenId: string
    amount: string
    address: string
  }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL_V2}/withdraw`, {
      method: "POST",
      body: {
        ...body,
        platform: "discord",
      },
    })
  }

  async getWithdrawTxnsV2(query: { profileId: string; tokenId: string }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL_V2}/withdraw/transactions/recent`,
      {
        query,
      },
    )
  }

  async getPaymes(profileId: string): Promise<any> {
    const { data: res, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profile/${profileId}/pay-me`,
    )
    let data = []
    if (ok) {
      data = res as any
    }
    return data
  }

  async getPaylinks(profileId: string): Promise<any> {
    const { data: res, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profile/${profileId}/pay-link`,
    )
    let data = []
    if (ok) {
      data = res as any
    }
    return data
  }

  async listEarningVaults(
    profileId: string,
    guildId: string,
    fetchTradeDetails = false,
  ): Promise<any> {
    const { data: res, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults`,
      { query: { fetchTradeDetails, guildId } },
    )
    let data = []
    if (ok) {
      data = res as any
    }
    return data
  }

  async getEarningVault(
    profileId: string,
    vaultId: string,
    query?: { roundId?: string },
  ): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/${vaultId}`,
      { query },
    )
  }

  async listGlobalEarningVault(profileId: string): Promise<any> {
    const { data: res, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/global`,
    )
    let data = []
    if (ok) {
      data = res as any
    }
    return data
  }

  async getTradeRounds(profileId: string, vaultId: string): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/${vaultId}/trade-rounds`,
    )
  }

  async getEarningVaultConfigs(
    profileId: string,
    vaultId: string,
  ): Promise<any> {
    const { ok, data: res } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/${vaultId}/configs`,
    )
    let data = null
    if (ok) {
      data = res as any
    }
    return data
  }

  async getInvestorPnls(
    profileId: string,
    vaultId: string,
    query?: { trade_set_id: string },
  ): Promise<any> {
    const { ok, data: res } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/${vaultId}/pnl`,
      { query },
    )
    let data = null
    if (ok) {
      data = res as any
    }
    return data
  }

  async claimTradingVault({
    profileId,
    vaultId,
  }: {
    profileId: string
    vaultId: string
  }): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/${vaultId}/claim`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
      },
    )
  }

  async depositToEarningVault({
    profileId,
    vaultId,
    amount,
    tokenId,
  }: {
    profileId: string
    vaultId: string
    amount: string
    tokenId: string
  }): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/${vaultId}/deposit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
        body: { amount, token_id: tokenId, platform: "discord" },
      },
    )
  }

  async getApplicationVaultsByProfileId(profileId: string): Promise<any> {
    const { data, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/applications/vaults`,
    )
    return ok ? data : []
  }

  async getAppVaultBalances(
    profileId: string,
    appId: string,
    vaultId: string,
  ): Promise<any> {
    const { data, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/applications/${appId}/vaults/${vaultId}/balances`,
      { headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` } },
    )
    return ok ? data : []
  }

  async getApplicationVaultBalancesByProfile(profileId: string): Promise<any> {
    const vaults = await this.getApplicationVaultsByProfileId(profileId)

    const result = []
    for (const vault of vaults) {
      const balances = await this.getAppVaultBalances(
        profileId,
        vault.application_id,
        vault.vault_profile_id,
      )
      const totalBalance = balances.reduce(
        (acc: number, curr: any) => acc + curr.usd_amount,
        0,
      )
      result.push({
        ...vault,
        total: totalBalance,
      })
    }
    return result
  }

  // New methods for vault transfer requests
  async createVaultTransferRequest(params: {
    profileId: string
    appId: string
    vaultId: string
    targetProfileId: string
    tokenId: string
    amount: string
    reason?: string
  }): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${params.profileId}/applications/${params.appId}/vaults/${params.vaultId}/transfer-requests`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
        body: {
          recipient_profile_id: params.targetProfileId,
          token_id: params.tokenId,
          token_amount: params.amount,
          description: params.reason,
          requester_metadata: {
            platform: "discord",
          },
        },
      },
    )
  }

  async listVaultTransferRequests(params: {
    profileId: string
    appId: string
    vaultId: string
    status?: string
    page?: number
    size?: number
  }): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${params.profileId}/applications/${params.appId}/vaults/${params.vaultId}/transfer-requests`,
      {
        query: {
          status: params.status,
          page: params.page || 0,
          size: params.size || 10,
        },
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
      },
    )
  }

  async approveVaultTransferRequest(params: {
    profileId: string
    appId: string
    vaultId: string
    requestId: string
    message?: string
  }): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${params.profileId}/applications/${params.appId}/vaults/${params.vaultId}/transfer-requests/${params.requestId}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
        body: {
          message: params.message,
          platform: "discord",
        },
      },
    )
  }

  async rejectVaultTransferRequest(params: {
    profileId: string
    appId: string
    vaultId: string
    requestId: string
    reason?: string
  }): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${params.profileId}/applications/${params.appId}/vaults/${params.vaultId}/transfer-requests/${params.requestId}/reject`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
        body: {
          reason: params.reason,
          platform: "discord",
        },
      },
    )
  }

  async getApplicationsByProfileId(profileId: string): Promise<any> {
    const { data, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/applications`,
      {
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
      },
    )
    return ok ? data : []
  }

  async listVaultsByApplicationId(
    profileId: string,
    appId: string,
  ): Promise<any> {
    const { data, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/applications/${appId}/vaults`,
      {
        headers: { Authorization: `Bearer ${MOCHI_BOT_SECRET}` },
      },
    )
    return ok ? data : []
  }
}

export default new MochiPay()
