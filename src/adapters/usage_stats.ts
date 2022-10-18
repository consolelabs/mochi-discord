import { API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"

class UsageStats extends Fetcher {
  public async createUsageStat(req: {
    guild_id: string
    user_id: string
    command: string
    success: boolean
    args: string
    execution_time_ms?: number
  }) {
    return await this.jsonFetch(`${API_BASE_URL}/usage-stats`, {
      method: "POST",
      body: req,
    })
  }
}

export default new UsageStats()
