import { OpenSeaStreamClient } from "@opensea/stream-js"
import { OPENSEA_TOKEN } from "env"

let client: OpenSeaStreamClient | null = null
if (OPENSEA_TOKEN) {
  client = new OpenSeaStreamClient({
    token: OPENSEA_TOKEN,
  })
  client.connect()
}

export default client
