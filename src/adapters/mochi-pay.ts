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
    note?: string
  }) {
    return await this.jsonFetch(`${MOCHI_PAY_API_BASE_URL}/pay-requests`, {
      method: "POST",
      body,
    })
  }
}

export default new MochiPay()
