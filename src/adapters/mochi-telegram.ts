import fetch from "node-fetch"
import { MOCHI_TELEGRAM_API_BASE_URL } from "utils/constants"

class MochiTelegram {
  public async sendMessage(req: any) {
    const res = await fetch(`${MOCHI_TELEGRAM_API_BASE_URL}/message`, {
      method: "POST",
      body: JSON.stringify(req),
    })
    return await res?.json()
  }
}

export default new MochiTelegram()
