import fetch from "node-fetch"
import { MOCHI_TELEGRAM_API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"

class MochiTelegram extends Fetcher {
  public async sendMessage(req: any) {
    const res = await fetch(`${MOCHI_TELEGRAM_API_BASE_URL}/message`, {
      method: "POST",
      body: JSON.stringify(req),
    })
    return await res?.json()
  }

  public async getByUsername(username: string) {
    return await this.jsonFetch(
      `${MOCHI_TELEGRAM_API_BASE_URL}/users/get-by-username/${username}`
    )
  }
}

export default new MochiTelegram()
