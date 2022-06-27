import { Message } from "discord.js"
import { NftSales } from "types/sales"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import { Command } from "types/common"
import { renderSalesMessage } from "utils/sales"

async function renderSalesMessages(msg: Message, sales: NftSales) {
  const embed = composeEmbedMessage(msg, {
    image: "attachment://renderSaleMessages.png",
  })

  return {
    messageOptions: {
      embeds: [embed],
      files: [await renderSalesMessage(msg, sales)],
    },
  }
}

const command: Command = {
  id: "testdemo",
  command: "testdemo",
  brief: "Check test demo",
  category: "Profile",
  run: async (msg) => {
    const sales: NftSales = {
      avatar:
        "https://info-imgs.vgcloud.vn/2022/01/03/13/gap-go-con-meo-hai-mat-ky-la-noi-tieng-khap-mang-xa-hoi.jpg",
      rarity: "Legendary",
      marketplace: "OpenSea",
      fromAddress: "0x5646546121321897560",
      price: "0.012 ETH",
      hodl: "44 days",
      rank: 938,
      transactionAddress: "0x5646546121321897560",
      toAddress: "0x5646546121321897560",
      bought: "0.011 ETH",
      gain: "0.002 ETH",
      sold: "0.012 ETH",
      pnl: "$2.19",
      subPnl: "+72.66%",
      collection: "Cyber Neko",
      name: "Cyber Neko #1",
    }

    return renderSalesMessages(msg, sales)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}testdemo`,
          usage: `${PREFIX}testdemo`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
