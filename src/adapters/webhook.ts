import { logger } from "logger"
import fetch from "node-fetch"
import { API_BASE_URL } from "utils/constants"

class Webhook {
  public async pushDiscordWebhook(event: string, data: any): Promise<any> {
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
    } catch (e: any) {
      logger.error(e)
    }
  }
}

export default new Webhook()
