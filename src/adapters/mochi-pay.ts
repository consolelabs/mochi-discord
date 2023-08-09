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
      }
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
    type: string
  ): Promise<any[]> {
    const { data: res, ok } = await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/pay-requests?profile_id=${profileId}&type=${type}`
    )
    let data = []
    if (ok) {
      data = res as any[]
    }
    return data
  }

  public async generatePaymentCode(body: {
    profileId: string
    amount: string
    token: string
    type: "paylink" | "payme"
    note?: string
    recipient_id?: string
  }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/pay-requests`, {
      method: "POST",
      body,
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
      }
    )
  }

  public async getBalances({
    profileId,
    token,
  }: {
    profileId: string
    token?: string
  }) {
    const url = `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/${profileId}/balances/${
      token ?? ""
    }`
    return await this.jsonFetch(url)
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
      }
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
      }
    )
  }

  async getTokens(query: { symbol?: string }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/tokens`, {
      query,
    })
  }

  async getListTx(query: { profile_id: string }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/transactions`,
      {
        query,
      }
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
      }
    )
  }

  async getListSwapTx(query: { profile_id: string }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/swap/transactions`, {
      query,
    })
  }

  async krystalStake(body: KrystalStakeRequest) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/earns/krystal/stake`,
      {
        method: "POST",
        body,
      }
    )
  }

  async krystalUnstake(body: KrystalUnstakeRequest) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/earns/krystal/unstake`,
      {
        method: "POST",
        body,
      }
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
      }
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
      }
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
      }
    )
  }

  async approveTransferRequest({ requestCode }: { requestCode: string }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/requests/${requestCode}/approved`,
      {
        method: "POST",
      }
    )
  }

  async rejectTransferRequest({ requestCode }: { requestCode: string }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/requests/${requestCode}/rejected`,
      {
        method: "POST",
      }
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
      }
    )
  }
}

export default new MochiPay()
