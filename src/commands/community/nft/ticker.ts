import {
  ButtonInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { NFT_TICKER_GITBOOK, PREFIX } from "utils/constants"
import {
  composeDaysSelectMenu,
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeEmbedMessage,
  getErrorEmbed,
  getExitButton,
  justifyEmbedFields,
} from "utils/discordEmbed"
import community from "adapters/community"
import {
  defaultEmojis,
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  shortenHashOrAddress,
} from "utils/common"
import { renderChartImage } from "utils/canvas"
import dayjs from "dayjs"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { APIError } from "errors"
import {
  ResponseCollectionSuggestions,
  ResponseIndexerNFTCollectionTickersData,
  ResponseIndexerPrice,
} from "types/api"
import { CommandError } from "errors"

const dayOpts = [1, 7, 30, 60, 90, 365]
const decimals = (p?: ResponseIndexerPrice) => p?.token?.decimals ?? 0

function buildSwitchViewActionRow(
  currentView: string,
  params: {
    collectionAddress: string
    chain: string
    days?: number
    authorId: string
  }
) {
  const { collectionAddress, chain, days = 7, authorId } = params
  const tickerButton = new MessageButton({
    label: "📈 Ticker",
    customId: `nft_ticker_view_chart-${collectionAddress}-${chain}-${days}-${authorId}`,
    style: "SECONDARY",
    disabled: currentView === "ticker",
  })
  const nftButton = new MessageButton({
    label: "🔎 Info",
    customId: `nft_ticker_view_info-${collectionAddress}-${chain}-${days}-${authorId}`,
    style: "SECONDARY",
    disabled: currentView === "info",
  })
  const row = new MessageActionRow()
  row.addComponents([tickerButton, nftButton])
  return row
}

export async function handleNFTTickerViews(interaction: ButtonInteraction) {
  const msg = <Message>interaction.message
  const [collectionAddress, chain, days, authorId] = interaction.customId
    .split("-")
    .slice(1)
  await interaction.deferUpdate()
  if (authorId !== interaction.user.id) {
    return
  }
  if (interaction.customId.startsWith("nft_ticker_view_chart")) {
    await viewTickerChart(msg, authorId, { collectionAddress, chain, days })
    return
  }
  await viewTickerInfo(msg, authorId, { collectionAddress, chain })
}

async function viewTickerChart(
  msg: Message,
  authorId: string,
  params: { collectionAddress: string; chain: string; days: string }
) {
  const { collectionAddress, chain, days } = params
  const { messageOptions } = await composeCollectionTickerEmbed({
    msg,
    authorId,
    collectionAddress,
    chain,
    ...(days && { days: +days }),
  })
  await msg.edit(messageOptions)
}

async function viewTickerInfo(
  msg: Message,
  authorId: string,
  params: { collectionAddress: string; chain: string }
) {
  const { collectionAddress, chain } = params
  const { messageOptions } = await composeCollectionInfoEmbed(
    msg,
    authorId,
    collectionAddress,
    chain
  )
  await msg.edit(messageOptions)
  await msg.removeAttachments()
}

function composeTickerSelectionResponse(
  suggestions: ResponseCollectionSuggestions[],
  symbol: string,
  msg: Message
) {
  const opt = (s: ResponseCollectionSuggestions): MessageSelectOptionData => ({
    label: `${s.name} (${s.symbol})`,
    value: `${s.address}_${s.chain}_${msg.author.id}`,
  })
  const selectRow = composeDiscordSelectionRow({
    customId: "nft_tickers_selection",
    placeholder: "Make a selection",
    options: suggestions.map(opt),
  })

  const found = suggestions.map((s) => `**${s.name}** (${s.symbol})`).join(", ")
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.MAG} Multiple collections found`,
          description: `Multiple collections found for \`${symbol}\`: ${found}.\nPlease select one of the following collection`,
        }),
      ],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    commandChoiceOptions: {
      userId: msg.author.id,
      guildId: msg.guildId,
      channelId: msg.channelId,
      handler: tickerSelectionHandler,
    },
  }
}

async function composeCollectionInfoEmbed(
  msg: Message,
  authorId: string,
  collectionAddress: string,
  chain: string
) {
  const { data, ok, curl, log } = await community.getNFTCollectionMetadata(
    collectionAddress,
    chain
  )
  if (!ok) {
    throw new APIError({ message: msg, curl: curl, description: log })
  }
  if (!data) {
    throw new CommandError({
      message: msg,
      description: "The collection does not exist. Please choose another one.",
    })
  }
  const symbol = `${data.symbol?.toUpperCase() ?? "-"}`
  const address = data.address
    ? `\`${shortenHashOrAddress(data.address)}\``
    : "-"
  const name = `${data.name ?? "-"}`
  const desc = `${data.description ?? "-"}`
  const discord = data.discord ? `[Link](${data.discord})` : "-"
  const twitter = data.twitter ? `[Link](${data.twitter})` : "-"
  const website = data.website ? `[Link](${data.website})` : "-"
  const ercFormat = `${data.erc_format ?? "-"}`
  const marketplaces = data.marketplaces
    ? data.marketplaces.map((m: string) => getEmoji(m)).join(" ")
    : "-"
  let createdTime = "-"
  if (data.created_at) {
    createdTime = dayjs(data.created_at).format("DD/MM/YYYY")
  }
  const fields = [
    {
      name: "Symbol",
      value: symbol,
    },
    {
      name: "Address",
      value: address,
    },
    {
      name: "Chain",
      value: `${getEmoji(chain)}`,
    },
    {
      name: "Marketplace",
      value: marketplaces,
    },
    {
      name: "Format",
      value: ercFormat,
    },
    {
      name: "Created at",
      value: createdTime,
    },
    {
      name: `Website`,
      value: website,
    },
    {
      name: `Discord`,
      value: discord,
    },
    {
      name: `Twitter`,
      value: twitter,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const collectionImage = data.image ?? getEmojiURL(emojis["NFTS"])
  const embed = composeEmbedMessage(msg, {
    author: [`${name}`, collectionImage],
    description: desc,
    image: "attachment://chart.png",
    thumbnail: collectionImage,
  }).addFields(fields)

  const buttonRow = buildSwitchViewActionRow("info", {
    collectionAddress,
    chain,
    authorId: authorId,
  }).addComponents(getExitButton(authorId))
  return {
    messageOptions: {
      embeds: [justifyEmbedFields(embed, 3)],
      components: [buttonRow],
    },
  }
}

async function composeCollectionTickerEmbed({
  msg,
  authorId,
  collectionAddress,
  chain,
  days = 30,
}: {
  msg: Message
  authorId: string
  collectionAddress: string
  chain: string
  days?: number
}) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(days, "day").unix() * 1000
  const { data, ok, log, curl } = await community.getNFTCollectionTickers({
    collectionAddress,
    from,
    to,
  })
  if (!ok) {
    throw new APIError({ message: msg, curl: curl, description: log })
  }

  // collection is not exist, mochi has not added it yet
  if (!data) {
    throw new CommandError({
      message: msg,
      description: "The collection does not exist. Please choose another one.",
    })
  }

  const blank = getEmoji("blank")
  const {
    items,
    owners,
    name,
    collection_image,
    total_volume,
    floor_price,
    last_sale_price,
    price_change_1d,
    price_change_7d,
    price_change_30d,
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
  const marketcap = floorPriceAmount * (items ?? 0)
  const formatPrice = (amount: number) => {
    if (!amount) return `- ${blank}`
    const formatter = Intl.NumberFormat("en", { notation: "compact" })
    return `${formatter.format(amount)}${blank}`
  }
  const getChangePercentage = (changeStr: string | undefined) => {
    const change = changeStr ? +changeStr : 0
    const trend =
      change > 0
        ? defaultEmojis.CHART_WITH_UPWARDS_TREND
        : change === 0
        ? ""
        : defaultEmojis.CHART_WITH_DOWNWARDS_TREND
    return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
  }

  const fields = [
    {
      name: "Item",
      value: `${items}${blank}`,
    },
    {
      name: "Owner",
      value: `${owners}${blank}`,
    },
    {
      name: `Market cap (${priceToken})`,
      value: formatPrice(marketcap),
    },
    {
      name: `Volume (${priceToken})`,
      value: formatPrice(totalVolumeAmount),
    },
    {
      name: `Floor price (${priceToken})`,
      value: formatPrice(floorPriceAmount),
    },
    {
      name: `Last sale (${priceToken})`,
      value: formatPrice(lastSalePriceAmount),
    },
    {
      name: "Change (24h)",
      value: getChangePercentage(price_change_1d),
    },
    {
      name: "Change (7d)",
      value: getChangePercentage(price_change_7d),
    },
    {
      name: "Change (1M)",
      value: getChangePercentage(price_change_30d),
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const collectionImage = collection_image ?? getEmojiURL(emojis["NFTS"])
  const embed = composeEmbedMessage(msg, {
    author: [`${name}`, collectionImage],
    image: "attachment://chart.png",
  }).addFields(fields)

  const chart = await renderNftTickerChart({ data })
  const selectRow = composeDaysSelectMenu(
    "nft_ticker_selection",
    collectionAddress,
    dayOpts,
    30
  )
  const buttonRow = buildSwitchViewActionRow("ticker", {
    collectionAddress,
    days: days ?? 7,
    authorId,
    chain,
  }).addComponents(getExitButton(authorId))
  return {
    messageOptions: {
      files: chart ? [chart] : [],
      embeds: [justifyEmbedFields(embed, 3)],
      components: [selectRow, buttonRow],
    },
    commandChoiceOptions: {
      userId: authorId,
      guildId: msg.guildId,
      channelId: msg.channelId,
      handler,
    },
  }
}

async function renderNftTickerChart({
  collectionAddress,
  days = 30,
  data,
}: {
  collectionAddress?: string
  days?: number
  data?: ResponseIndexerNFTCollectionTickersData
}) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(days, "day").unix() * 1000
  if (!data && collectionAddress) {
    const res = await community.getNFTCollectionTickers({
      collectionAddress,
      from,
      to,
    })
    if (!res.ok) {
      return null
    }
    data = res.data
  }
  if (!data?.tickers?.prices || !data?.tickers.times) {
    return null
  }
  const token = data.floor_price?.token?.symbol ?? ""
  const fromLabel = dayjs(from).format("MMMM DD, YYYY")
  const toLabel = dayjs(to).format("MMMM DD, YYYY")
  const chartData = data.tickers.prices.map(
    (p) => +(p.amount ?? 0) / Math.pow(10, decimals(p))
  )
  const chart = await renderChartImage({
    chartLabel: `Floor price (${token}) | ${fromLabel} - ${toLabel}`,
    labels: data.tickers.times,
    data: chartData,
  })
  return new MessageAttachment(chart, "chart.png")
}

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  await interaction.deferUpdate()
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [collectionAddress, days] = input.split("_")

  const chart = await renderNftTickerChart({
    collectionAddress,
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
  // this code block stores current day selection
  message.components[1].components.forEach((b) => {
    const customId = b.customId
    if (!customId?.startsWith("nft_ticker_view")) return
    const params = customId?.split("-")
    params[3] = days
    b.customId = params.join("-")
  })

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

const tickerSelectionHandler: CommandChoiceHandler = async (
  msgOrInteraction
) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  await interaction.deferUpdate()
  const { message } = <{ message: Message }>interaction
  const value = interaction.values[0]
  const [collectionAddress, chain, authorId] = value.split("_")
  return await composeCollectionTickerEmbed({
    msg: message,
    collectionAddress,
    chain,
    authorId,
  })
}

const command: Command = {
  id: "nft_ticker",
  command: "ticker",
  brief: "Check an NFT collection ticker",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const symbol = args[2]
    const {
      data: suggestions,
      ok,
      log,
      curl,
    } = await community.getNFTCollectionSuggestions(symbol)
    if (!ok) throw new APIError({ message: msg, curl, description: log })
    if (!suggestions.length) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Collection not found",
              description:
                "The collection is not supported yet. Please contact us for the support. Thank you!",
            }),
          ],
        },
      }
    }
    if (suggestions.length === 1) {
      return await composeCollectionTickerEmbed({
        msg,
        collectionAddress: suggestions[0].address ?? "",
        chain: suggestions[0].chain ?? "",
        authorId: msg.author.id,
      })
    }
    return composeTickerSelectionResponse(suggestions, symbol, msg)
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
