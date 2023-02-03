import { Sold } from "@paintswap/marketplace-interactions/dist/lib/marketplaceV3Types"
import config from "adapters/config"
import defi from "adapters/defi"
import paintswap from "clients/paintswap"
import { twitterUserClient as twitter } from "clients/twitter"
import { APIError } from "errors"
import { logger } from "logger"
import fetch from "node-fetch"
import { EUploadMimeType } from "twitter-api-v2"
import { getTokenMetadata, getTokenUri, standardizeIpfsUrl } from "utils/erc721"
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
    const tokenId = sale.tokenID.toString()
    const tokenUri = await getTokenUri(providers.ftm, sale.nft, +tokenId)
    const metadata = await getTokenMetadata(tokenUri)
    let mediaId: string | undefined
    if (metadata?.image) {
      const imageUrl = standardizeIpfsUrl(metadata?.image)
      const response = await fetch(imageUrl)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      mediaId = await twitter?.v1.uploadMedia(buffer, {
        mimeType: EUploadMimeType.Png,
      })
    }
    // 2. compose status
    const price = +sale.priceTotal.toString() / Math.pow(10, 18)
    const res = await defi.getFtmPrice()
    const json = await res.json().catch(() => null)
    const ftmPrice = json?.status === "1" ? `@ $${json?.result?.ethusd}` : ""
    const infos = [
      "🖌️ PaintSwap",
      `🧾 Collection: ${col.collection_name}`,
      `🖼️ Token: #${tokenId}\n`,
      `💰 Sold: ${price} FTM ${ftmPrice}\n`,
      `https://paintswap.finance/marketplace/${sale.marketplaceId.toNumber()}\n\n@pod_town`,
    ]
    const status = infos.join("\n")
    // 3. post tweet
    await twitter?.v2.tweet(status, {
      ...(mediaId && {
        media: { media_ids: [mediaId] },
      }),
    })
  }
}

export default Paintswap
