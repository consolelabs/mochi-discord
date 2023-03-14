import { MOCHI_PAY_API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"
import fetch from "node-fetch"

class MochiPay extends Fetcher {
  public async transfer(req: any) {
    const res = await fetch(`${MOCHI_PAY_API_BASE_URL}/transfer`, {
      method: "POST",
      body: JSON.stringify(req),
    })
    return await res?.json()
  }
}

export default new MochiPay()
