import { logger } from "logger"
import fetch from "node-fetch"
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
      logger.error(e as string)
    }
  }
}

export default new Webhook()
