import { APIError } from "errors"
import { API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"

class Webhook extends Fetcher {
  public async pushDiscordWebhook(
    event: string,
    data: unknown,
    profileId?: string,
  ) {
    try {
      const body = {
        event,
        data,
        profileId,
      }
      const res = await this.jsonFetch(`${API_BASE_URL}/webhook/discord`, {
        method: "POST",
        body,
        isWebhook: true,
      })

      if (!res.ok) {
        throw new APIError({
          curl: res.curl,
          description: res.log,
          status: res.status ?? 500,
        })
      }

      return res
    } catch (e: any) {
      // TODO: sentry?
    }
  }
}

export default new Webhook()
