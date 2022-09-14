import fetch from "node-fetch"
import ChannelLogger from "utils/ChannelLogger"
import { API_BASE_URL } from "utils/constants"

class Webhook {
  public async pushDiscordWebhook(event: string, data: unknown) {
    try {
      const body = JSON.stringify({
        event: event,
        data: data,
      })
      const res = await fetch(`${API_BASE_URL}/webhook/discord`, {
        method: "POST",
        body: body,
      })

      const json = await res.json()
      if (json.error !== undefined) {
        throw new Error(json.error)
      }

      return json
    } catch (e) {
      ChannelLogger.alertWebhook(event, data)
    }
  }
}

export default new Webhook()
