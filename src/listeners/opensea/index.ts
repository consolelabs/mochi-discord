import config from "adapters/config"
import { APIError } from "errors"
import stream from "clients/opensea-stream"
import { twitterUserClient as twitter } from "clients/twitter"
import { logger } from "logger"

class Opensea {
  constructor() {
    logger.info(`[Opensea] start listening to events ...`)
    if (stream) {
      this.listen()
    }
  }

  private async listen() {
    const { data, ok, log, curl, error } = await config.getSaleTwitterConfigs({
      marketplace: "opensea",
    })
    if (!ok) {
      throw new APIError({ curl, description: log, error })
    }
    const slugs = data.filter((cfg: any) => cfg.slug)
    for (const slug of slugs) {
      stream?.onItemSold(slug, async (event) => {
        logger.info(`[Opensea] New sale: ${event.payload.item.permalink}`)
        await twitter.v2.tweet(
          `New sale!\n${event.payload.item.metadata.name} - ${event.payload.item.nft_id}`
        )
      })
    }
  }
}

export default Opensea
