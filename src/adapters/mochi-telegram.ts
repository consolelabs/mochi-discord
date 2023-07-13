import { MOCHI_TELEGRAM_API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"

class MochiTelegram extends Fetcher {
  public async getByUsername(username: string) {
    return await this.jsonFetch(
      `${MOCHI_TELEGRAM_API_BASE_URL}/users/get-by-username/${username}`
    )
  }
}

export default new MochiTelegram()
