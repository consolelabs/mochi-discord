import { EmbedFieldData, Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { HOMEPAGE_URL, PREFIX } from "utils/constants"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import community from "adapters/community"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { renderChartImage } from "utils/canvas"

async function composeCollectionInfo(msg: Message, data: any) {
  const blank = getEmoji("blank")
  const {
    floor_price,
    chain,
    items,
    owners,
    total_volume,
    name,
    marketplaces,
    volume_token,
    address,
    collection_image,
  } = data

  const token = volume_token.toUpperCase()
  const tokenEmoji = getEmoji(volume_token)

  const fields = [
    {
      name: "Address",
      value: shortenHashOrAddress(address),
    },
    {
      name: "Chain",
      value: `${chain}${blank}`,
    },
    {
      name: "Item",
      value: `${items}${blank}`,
    },
    {
      name: "Owner",
      value: `${owners}${blank}`,
    },
    {
      name: "Volume",
      value: `${tokenEmoji} ${total_volume} ${token}${blank}`,
    },
    {
      name: "Marketplace",
      value: `${marketplaces.map((m: string) => getEmoji(m)).join(" ")}`,
    },
    {
      name: "Floor price",
      value: `${tokenEmoji} ${floor_price} ${token}${blank}`,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const embed = composeEmbedMessage(msg, {
    author: ["NFT Collection", ...(collection_image ? [collection_image] : [])],
    description: `[**${name}**](${HOMEPAGE_URL})`,
    image: "attachment://chart.png",
  }).addFields(fields)
  return justifyEmbedFields(embed, 3)
}

const command: Command = {
  id: "nft_ticker",
  command: "ticker",
  brief: "Check an NFT collection ticker",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const symbol = args[2]
    const data = await community.getNFTCollectionTickers(symbol)
    const { prices, times } = data.tickers
    const embed = await composeCollectionInfo(msg, data)
    if (!prices || !times) {
      return {
        messageOptions: {
          embeds: [embed],
        },
      }
    }

    const chart = await renderChartImage({
      chartLabel: "Floor price (USD)",
      labels: times,
      data: prices,
    })
    return {
      messageOptions: {
        embeds: [embed],
        files: [new MessageAttachment(chart, "chart.png")],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft ticker <collection_symbol>`,
          examples: `${PREFIX}nft ticker neko`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
