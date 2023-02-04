import { ItemSoldEvent } from "@opensea/stream-js"
import config from "adapters/config"
import stream from "clients/opensea-stream"
import { twitterUserClient as twitter } from "clients/twitter"
import { APIError } from "errors"
import { logger } from "logger"
import { EUploadMimeType } from "twitter-api-v2"
import { pullImage } from "utils/common"
import { standardizeIpfsUrl } from "utils/erc721"

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
        logger.info(`[Opensea] New sale: ${event.payload.item.permalink}`)
        await this.handleNewSale(event)
      })
    }
  }

  private async handleNewSale(event: ItemSoldEvent) {
    const { payload } = event
    const { item } = payload
    const { metadata } = item
    // 1. upload tweet image
    const [tokenId] = item.nft_id.split("/").slice(2)
    let mediaId: string | undefined
    if (metadata.image_url) {
      const buffer = await pullImage(standardizeIpfsUrl(metadata.image_url))
      mediaId = await twitter?.v1.uploadMedia(buffer, {
        mimeType: EUploadMimeType.Png,
      })
    }
    // 2. compose status
    const { payment_token } = payload
    const price = +payload.sale_price / Math.pow(10, payment_token.decimals)
    const infos = [
      "⛵ Opensea",
      `🧾 Collection: ${metadata.name}`,
      `🖼️ Token: #${tokenId}\n`,
      `💰 Sold: ${price} ${payment_token.symbol} @ $${Number(
        payment_token.usd_price
      ).toLocaleString()}\n`,
      `${item.permalink}\n`,
      "@pod_town",
    ]
    const status = infos.join("\n")
    await twitter?.v2.tweet(status, {
      ...(mediaId && {
        media: { media_ids: [mediaId] },
      }),
    })
  }
}

export default Opensea
