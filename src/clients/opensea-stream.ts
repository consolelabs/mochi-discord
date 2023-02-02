import { OpenSeaStreamClient } from "@opensea/stream-js"
import { OPENSEA_API_KEY } from "env"

let client: OpenSeaStreamClient | null = null
if (OPENSEA_API_KEY) {
  client = new OpenSeaStreamClient({
    token: OPENSEA_API_KEY,
  })
  client.connect()
}

export default client
