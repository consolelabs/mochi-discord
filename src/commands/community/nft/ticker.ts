import {
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { HOMEPAGE_URL, NFT_TICKER_GITBOOK, PREFIX } from "utils/constants"
import {
  composeDaysSelectMenu,
  composeDiscordExitButton,
  composeEmbedMessage,
  justifyEmbedFields,
  getErrorEmbed,
} from "utils/discordEmbed"
import community from "adapters/community"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  shortenHashOrAddress,
} from "utils/common"
import { renderChartImage } from "utils/canvas"
import dayjs from "dayjs"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { APIError } from "errors"
import {
  ResponseIndexerNFTCollectionTickersData,
  ResponseIndexerPrice,
} from "types/api"

const dayOpts = [1, 7, 30, 60, 90, 365]
const decimals = (p?: ResponseIndexerPrice) => p?.token?.decimals ?? 0

async function composeCollectionTickerEmbed({
  msg,
  symbol,
  days = 30,
}: {
  msg: Message
  symbol: string
  days?: number
}) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(days, "day").unix() * 1000
  const res = await community.getNFTCollectionTickers({ symbol, from, to })
  if (!res.ok) {
    throw new APIError({ message: msg, description: res.log })
  }

  // collection is not exist, mochi has not added it yet
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            title: "Invalid collection",
            description:
              "The collection does not exist. Please choose another one.",
          }),
        ],
      },
    }
  }
  const data = res.data
  const blank = getEmoji("blank")
  const {
    chain,
    items,
    owners,
    name,
    marketplaces,
    address,
    collection_image,
    total_volume,
    floor_price,
    last_sale_price,
  } = data

  const floorPriceAmount = Math.round(
    +(floor_price?.amount ?? 0) / Math.pow(10, decimals(floor_price))
  )
  const totalVolumeAmount = Math.round(
    +(total_volume?.amount ?? 0) / Math.pow(10, decimals(total_volume))
  )
  const lastSalePriceAmount = Math.round(
    +(last_sale_price?.amount ?? 0) / Math.pow(10, decimals(last_sale_price))
  )
  const priceToken = floor_price?.token?.symbol?.toUpperCase() ?? ""
  const formatPrice = (amount: number) => {
    if (!amount) return `- ${blank}`
    return `${amount.toLocaleString()} ${priceToken}${blank}`
  }

  const fields = [
    {
      name: "Chain",
      value: `${chain?.name}${blank}`,
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
      value: formatPrice(totalVolumeAmount),
    },
    {
      name: "Floor price",
      value: formatPrice(floorPriceAmount),
    },
    {
      name: "Last sale",
      value: formatPrice(lastSalePriceAmount),
    },
    {
      name: "Address",
      value: address ? shortenHashOrAddress(address) : "N/A",
    },
    {
      name: "Marketplace",
      value: `${
        marketplaces?.map((m: string) => getEmoji(m)).join(" ") ?? "N/A"
      }`,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const embed = composeEmbedMessage(msg, {
    author: ["NFT Collection", getEmojiURL(emojis["NFTS"])],
    thumbnail: collection_image,
    description: `[**${name}**](${HOMEPAGE_URL})`,
    image: "attachment://chart.png",
  }).addFields(fields)

  const chart = await renderNftTickerChart({ data })
  const selectRow = composeDaysSelectMenu(
    "nft_ticker_selection",
    symbol,
    dayOpts,
    30
  )
  return {
    messageOptions: {
      files: chart ? [chart] : [],
      embeds: [justifyEmbedFields(embed, 3)],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    commandChoiceOptions: {
      userId: msg.author.id,
      guildId: msg.guildId,
      channelId: msg.channelId,
      messageId: msg.id,
      handler,
    },
  }
}

async function renderNftTickerChart({
  symbol,
  days = 30,
  data,
}: {
  symbol?: string
  days?: number
  data?: ResponseIndexerNFTCollectionTickersData
}) {
  if (!data) {
    const to = dayjs().unix() * 1000
    const from = dayjs().subtract(days, "day").unix() * 1000
    const res = await community.getNFTCollectionTickers({ symbol, from, to })
    if (!res.ok) {
      return null
    }
    data = res.data
  }
  if (!data.tickers?.prices || !data.tickers.times) {
    return null
  }

  const chartData = data.tickers.prices.map(
    (p) => +(p.amount ?? 0) / Math.pow(10, decimals(p))
  )
  const chart = await renderChartImage({
    chartLabel: `Floor price`,
    labels: data.tickers.times,
    data: chartData,
  })
  return new MessageAttachment(chart, "chart.png")
}

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [symbol, days] = input.split("_")

  const chart = await renderNftTickerChart({
    // msg: message,
    symbol,
    days: +days,
  })

  // update chart image
  const [embed] = message.embeds
  await message.removeAttachments()
  embed.setImage("attachment://chart.png")

  const selectMenu = message.components[0].components[0] as MessageSelectMenu
  selectMenu.options.forEach(
    (opt, i) => (opt.default = i === dayOpts.indexOf(+days))
  )

  return {
    messageOptions: {
      embeds: [embed],
      files: chart ? [chart] : [],
      components: message.components as MessageActionRow[],
    },
    commandChoiceOptions: {
      handler,
      userId: message.author.id,
      messageId: message.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      interaction,
    },
  }
}

const command: Command = {
  id: "nft_ticker",
  command: "ticker",
  brief: "Check an NFT collection ticker",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const symbol = args[2]
    return await composeCollectionTickerEmbed({ msg, symbol })
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft ticker <collection_symbol>`,
          examples: `${PREFIX}nft ticker neko`,
          document: NFT_TICKER_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
