import { EmbedFieldData, Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import community from "adapters/community"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { renderChartImage } from "utils/canvas"

async function composeCollectionInfo(msg: Message, symbol: string, data: any) {
  const { floor_price, name, contract_address, chain, platforms = [] } = data
  const fields = [
    {
      name: "Name",
      value: `\`${name}\``,
    },
    {
      name: "Symbol",
      value: `\`${symbol.toUpperCase()}\``,
    },
    {
      name: "Contract",
      value: `\`${shortenHashOrAddress(contract_address)}\``,
    },
    {
      name: "Chain",
      value: `\`${chain}\``,
    },
    {
      name: "Platforms",
      value: platforms.map((platform: string) => getEmoji(platform)).join(" "),
    },
    {
      name: "Floor Price",
      value: `\`$${(floor_price * 1000).toLocaleString()}\``,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const embed = composeEmbedMessage(msg, {
    title: "NFT Collection",
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
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const symbol = args[2]
    const data = await community.getNFTCollectionTickers(symbol)
    const { prices, times } = data.tickers
    const embed = await composeCollectionInfo(msg, symbol, data)
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
