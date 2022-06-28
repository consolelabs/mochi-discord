import { EmbedFieldData, Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import community from "adapters/community"
import { getEmoji } from "utils/common"
import { renderChartImage } from "utils/canvas"

async function composeCollectionInfo(msg: Message, data: any) {
  const blank = getEmoji("blank")
  const {
    floor_price,
    chain,
    item,
    owner,
    volume,
    last_price,
    change1h,
    change24h,
    change7d,
    name,
    collection_image,
  } = data
  const PriceChange = {
    change1h:
      change1h <= 0
        ? "```diff\n" + change1h + "\n```"
        : "```yaml\n+" + change1h + "\n```",
    change24h:
      change24h <= 0
        ? "```diff\n" + change24h + "\n```"
        : "```yaml\n+" + change24h + "\n```",
    change7d:
      change7d <= 0
        ? "```diff\n" + change7d + "\n```"
        : "```yaml\n+" + change7d + "\n```",
  }
  const fields = [
    {
      name: "Chain",
      value: `${chain}${blank}`,
    },
    {
      name: "Item",
      value: `${item}${blank}`,
    },
    {
      name: "\u200b",
      value: "\u200b" + `${blank}`,
    },
    {
      name: "Owner",
      value: `${owner}${blank}`,
    },
    {
      name: "Volume",
      value: `${volume}${blank}`,
    },
    {
      name: "\u200b",
      value: "\u200b" + `${blank}`,
    },
    {
      name: "Floor price",
      value: `${floor_price * 1000}${blank}`,
    },
    {
      name: "Last price",
      value: `${last_price * 1000}${blank}`,
    },
    {
      name: "\u200b",
      value: "\u200b" + `${blank}`,
    },
    {
      name: "Change (1h)",
      value: `${PriceChange.change1h}${blank}`,
    },
    {
      name: "Change (24h)",
      value: `${PriceChange.change24h}${blank}`,
    },
    {
      name: "Change (7d)",
      value: `${PriceChange.change7d}${blank}`,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const embed = composeEmbedMessage(msg, {
    title: `${getEmoji("cup")} NFT Collection`,
    description: `[${name}](https://google.com.vn)`,
    image: "attachment://chart.png",
    thumbnail: collection_image,
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
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const symbol = args[2]
    const res = await community.getNFTCollectionTickers(symbol)
    const data = {
      last_price: 0.0012,
      change1h: -0.64,
      change24h: -0.01,
      change7d: 2.71,
      owner: "4.15K",
      volume: "955.82 ETH",
      item: "6.97K",
      collection_image:
        "https://lh3.googleusercontent.com/lP0ywqisBVutTJZ_Uuhe7JFqvticZjRypfQh4CpXwcljxM_JlO0jT-4-LRil18KPHidXm9slLkTDta1XRC5HAg2IVhwCVohdNF3odQ",
      ...res,
    }
    const { prices, times } = data.tickers
    const embed = await composeCollectionInfo(msg, data)
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
}

export default command
