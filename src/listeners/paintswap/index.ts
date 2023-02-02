import config from "adapters/config"
import { APIError } from "errors"
import paintswap from "clients/paintswap"
import { twitterUserClient as twitter } from "clients/twitter"
import { logger } from "logger"

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
      // handle new sale
      await twitter?.v2.tweet(
        `${col.collection_name} ${sale.tokenID.toNumber()} SOLD for ${
          sale.priceTotal.toNumber() / Math.pow(10, 18)
        } FTM\n→ https://paintswap.finance/marketplace/${sale.marketplaceId.toNumber()}\n@pod_town`
      )
    })
  }
}

export default Paintswap
