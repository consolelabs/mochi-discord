import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { composeEmbedMessage } from "utils/discordEmbed"
import client from "../index"
import { TextChannel } from "discord.js"

export async function Test() {
  // console.log("is it interval ???")
  const sales = await fetch(`${API_BASE_URL}/nfts/sales`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  const dataSales = await sales.json()

  const embeds = []
  for (const sale of dataSales.data) {
    // const discordSales = buildDiscordMessage()
    // console.log(
    //   `this is sales data: ${sale.nft_name} - ${sale.nft_collection_address}`
    // )
    const saleMess = composeEmbedMessage(null, {
      title: sale.nft_name,
      description: sale.nft_collection_address,
    })
    embeds.push(saleMess)
  }

  const channel = client.channels.cache.find(
    (c) => c.id === "701029345795375114"
  ) as TextChannel
  if (channel) {
    channel.send({
      embeds: embeds,
    })
  }
}
