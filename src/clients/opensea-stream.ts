import { OpenSeaStreamClient } from "@opensea/stream-js"
import { OPENSEA_API_KEY } from "env"
import { logger } from "logger"
import { WebSocket } from "ws"

let client: OpenSeaStreamClient | null = null
if (OPENSEA_API_KEY) {
  client = new OpenSeaStreamClient({
    token: OPENSEA_API_KEY,
    onError: (err) =>
      logger.error(`[Opensea] failed to create stream client: ${err}`),
    connectOptions: {
      transport: WebSocket,
    },
  })
  client.connect()
}

export default client
