import config from "adapters/config"
import { APIError } from "errors"
import stream from "clients/opensea-stream"
import { twitterUserClient as twitter } from "clients/twitter"
import { logger } from "logger"
import { ItemSoldEvent } from "@opensea/stream-js"
import { getTokenUri } from "utils/erc721"
import providers from "utils/providers"
import { EUploadMimeType } from "twitter-api-v2"

class Opensea {
  constructor() {
    logger.info(`[Opensea] start listening to events ...`)
    if (stream && twitter) {
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
    const collections = data.reduce(
      (acc: Record<string, any>, cur: any) => ({
        ...acc,
        [cur.slug]: cur,
      }),
      {}
    )
    for (const slug of Object.keys(collections)) {
      stream?.onItemSold(slug, async (event) => {
        logger.info(
          `[Opensea] New sale: [${slug}] ${event.payload.item.permalink}`
        )
        await this.handleNewSale(event, collections[slug])
      })
    }
  }

  private async handleNewSale(event: ItemSoldEvent, col: any) {
    // 1. upload tweet image
    const tokenUri = await getTokenUri(
      providers.eth,
      col.address,
      +event.payload.item.nft_id
    )
    const response = await fetch(tokenUri)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mediaId = await twitter?.v1.uploadMedia(buffer, {
      mimeType: EUploadMimeType.Png,
    })
    // 2. compose status
    const status = `${col.collection_name} ${event.payload.item.nft_id} SOLD for ${event.payload.sale_price} ETH\n\n→ ${event.payload.item.permalink}\n\n@pod_town`
    // 3. post tweet
    await twitter?.v2.tweet(status, {
      ...(mediaId && {
        media: { media_ids: [mediaId] },
      }),
    })
  }
}

export default Opensea
