import { Sold } from "@paintswap/marketplace-interactions/dist/lib/marketplaceV3Types"
import config from "adapters/config"
import paintswap from "clients/paintswap"
import { twitterUserClient as twitter } from "clients/twitter"
import { APIError } from "errors"
import { logger } from "logger"
import fetch from "node-fetch"
import { EUploadMimeType } from "twitter-api-v2"
import { getTokenUri } from "utils/erc721"
import providers from "utils/providers"

class Paintswap {
  constructor() {
    logger.info(`[Paintswap] start listening to events ...`)
    if (twitter) this.listen()
  }

  private async listen() {
    const { data, ok, log, curl, error } = await config.getSaleTwitterConfigs({
      marketplace: "paintswap",
    })
    if (!ok) {
      throw new APIError({ curl, description: log, error })
    }
    const collections = data.reduce(
      (acc: Record<string, any>, cur: any) => ({
        ...acc,
        [cur.address.toLowerCase()]: cur,
      }),
      {}
    )
    paintswap.onSold(async (sale) => {
      logger.info(
        `[Paintswap] New sale: ${sale.nft} - ${sale.marketplaceId.toNumber()}`
      )
      const addr = sale.nft.toLowerCase()
      if (!Object.keys(collections).includes(addr)) return
      const col = collections[addr]
      await this.handleNewSale(sale, col)
    })
  }

  private async handleNewSale(sale: Sold, col: any) {
    // 1. upload tweet image
    const tokenUri = await getTokenUri(
      providers.ftm,
      sale.nft,
      sale.tokenID.toNumber()
    )
    const response = await fetch(tokenUri)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mediaId = await twitter?.v1.uploadMedia(buffer, {
      mimeType: EUploadMimeType.Png,
    })
    // 2. compose status
    const status = `${
      col.collection_name
    } ${sale.tokenID.toNumber()} SOLD for ${
      sale.priceTotal.toNumber() / Math.pow(10, 18)
    } FTM\n\n→ https://paintswap.finance/marketplace/${sale.marketplaceId.toNumber()}\n\n@pod_town`
    // 3. post tweet
    await twitter?.v2.tweet(status, {
      ...(mediaId && {
        media: { media_ids: [mediaId] },
      }),
    })
  }
}

export default Paintswap
