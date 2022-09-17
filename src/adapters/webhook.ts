import ChannelLogger from "utils/ChannelLogger"
import { API_BASE_URL } from "utils/constants"
import { Fetcher } from "./fetcher"

class Webhook extends Fetcher {
  public async pushDiscordWebhook(event: string, data: unknown) {
    try {
      const body = {
        event: event,
        data: data,
      }
      const res = await this.jsonFetch(`${API_BASE_URL}/webhook/discord`, {
        method: "POST",
        body,
      })

      if (!res.ok) {
        throw new Error(res.log)
      }

      return res
    } catch (e: any) {
      ChannelLogger.alertWebhook(event, { data, error: e.message as string })
    }
  }
}

export default new Webhook()
