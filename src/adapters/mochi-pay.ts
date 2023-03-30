import { MOCHI_PAY_API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"
import fetch from "node-fetch"

class MochiPay extends Fetcher {
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

  public async generatePaymentCode(body: {
    profileId: string
    amount: string
    token: string
    type: "paylink" | "payme"
    note?: string
  }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/pay-requests`, {
      method: "POST",
      body,
    })
  }

  public async getBalances({
    profileId,
    token,
  }: {
    profileId: string
    token?: string
  }) {
    return await this.jsonFetch(
      `${MOCHI_PAY_API_BASE_URL}/mochi-wallet/${profileId}/balances/${
        token ?? ""
      }`
    )
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
        body,
      }
    )
  }
}

export default new MochiPay()
