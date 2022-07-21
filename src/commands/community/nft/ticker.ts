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
import { HOMEPAGE_URL, PREFIX } from "utils/constants"
import {
  composeDaysSelectMenu,
  composeDiscordExitButton,
  composeEmbedMessage,
  justifyEmbedFields,
} from "utils/discordEmbed"
import community from "adapters/community"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { renderChartImage } from "utils/canvas"
import { NftCollectionTicker, NftPrice } from "types/nft"
import dayjs from "dayjs"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"

const dayOpts = [1, 7, 30, 60, 90, 365]

async function composeCollectionTickerEmbed({
  msg,
  symbol,
  days = 7,
}: {
  msg: Message
  symbol: string
  days?: number
}) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(days, "day").unix() * 1000
  const data = await community.getNFTCollectionTickers({ symbol, from, to })
  const blank = getEmoji("blank")
  const {
    floor_price,
    chain,
    items,
    owners,
    total_volume,
    name,
    marketplaces,
    address,
    collection_image,
  } = data

  const floorPriceAmount = floor_price?.amount
  const totalVolumeAmount = total_volume?.amount
  const priceToken = floor_price?.token?.symbol?.toUpperCase() ?? ""
  const tokenEmoji = getEmoji(priceToken)

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
      value: `${tokenEmoji} ${totalVolumeAmount} ${priceToken}${blank}`,
    },
    {
      name: "Marketplace",
      value: `${
        marketplaces?.map((m: string) => getEmoji(m)).join(" ") ?? "N/A"
      }`,
    },
    {
      name: "Floor price",
      value: `${tokenEmoji} ${floorPriceAmount} ${priceToken}${blank}`,
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

  const chart = await renderNftTickerChart({ data })
  const selectRow = composeDaysSelectMenu(
    "nft_ticker_selection",
    symbol,
    dayOpts
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
      handler,
    },
  }
}

async function renderNftTickerChart({
  symbol,
  days = 7,
  data,
}: {
  symbol?: string
  days?: number
  data?: NftCollectionTicker
}) {
  if (!data) {
    const to = dayjs().unix() * 1000
    const from = dayjs().subtract(days, "day").unix() * 1000
    data = await community.getNFTCollectionTickers({ symbol, from, to })
  }
  const { prices, times } = data.tickers
  if (!prices || !times) {
    return null
  }

  const decimals = (p: NftPrice) => p.token?.decimals ?? 0
  const chartData = prices.map((p) => +p.amount / Math.pow(10, decimals(p)))
  const chart = await renderChartImage({
    chartLabel: `Floor price`,
    labels: times,
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
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
