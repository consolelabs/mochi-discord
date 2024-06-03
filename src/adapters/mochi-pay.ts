import {
  MOCHI_PAY_API_BASE_URL,
  MOCHI_PAY_API_BASE_URL_V2,
} from "utils/constants"
import { Fetcher } from "./fetcher"
import fetch from "node-fetch"
import { getKrystalEarnPortfolioResponse } from "types/mochipay"

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
    fetchTradeDetails = false,
  ): Promise<any> {
    const { data: res, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults`,
      { query: { fetchTradeDetails } },
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

  async getTradeRounds(profileId: string, vaultId: string): Promise<any> {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/profiles/${profileId}/syndicates/earning-vaults/${vaultId}/trade-rounds`,
    )
  }
}

export default new MochiPay()
