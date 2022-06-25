import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import client from "../index"
import { TextChannel } from "discord.js"
import { RenderSalesMessages } from "utils/sales"
import { NftSales } from "types/sales"

export async function ShowNftSales() {
  const saleTrackers = await fetch(`${API_BASE_URL}/nfts/sales-tracker`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  const dataSaleTrackers = await saleTrackers.json()

  for (const saleTracker of dataSaleTrackers.data) {
    const sales = await fetch(
      `${API_BASE_URL}/nfts/sales?collection-address=${saleTracker.contract_address}&platform=${saleTracker.platform}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const dataSales = await sales.json()

    // const embeds = []
    for (const sale of dataSales.data) {
      const saleModel: NftSales = {
        avatar:
          "https://info-imgs.vgcloud.vn/2022/01/03/13/gap-go-con-meo-hai-mat-ky-la-noi-tieng-khap-mang-xa-hoi.jpg",
        collection: "Cyber Neko",
        name: "Cyber Neko #1",
        rarity: "Legendary",
        marketplace: sale.platform,
        fromAddress: sale.seller,
        price: sale.nft_price + ` ${sale.nft_price_token}`,
        hodl: "44 days",
        rank: 938,
        transactionAddress: "0x5646546121321897560",
        toAddress: sale.buyer,
        bought: "0.011" + ` ${sale.nft_price_token}`,
        gain: "0.002" + ` ${sale.nft_price_token}`,
        sold: "0.012" + ` ${sale.nft_price_token}`,
        pnl: "$2.19",
        subPnl: "+72.66%",
        userID: "#1705",
      }
      const [embeds, files] = await RenderSalesMessages(null, saleModel)
      // embeds.push(saleMess)

      const channel = client.channels.cache.find(
        (c) => c.id === saleTracker.channel_id
      ) as TextChannel
      if (channel) {
        channel.send({
          embeds: embeds,
          files: files,
        })
      }
    }
  }
}
