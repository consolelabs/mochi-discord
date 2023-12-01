import community from "adapters/community"
import config from "adapters/config"
import dayjs from "dayjs"
import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageOptions,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { APIError, InternalError } from "errors"
import { InteractionHandler } from "handlers/discord/select-menu"
import {
  ResponseIndexerNFTCollectionTickersData,
  ResponseIndexerPrice,
} from "types/api"
import { RunResult } from "types/common"
import { renderChartImage, renderPlotChartImage } from "ui/canvas/chart"
import {
  composeEmbedMessage,
  formatDataTable,
  getMultipleResultEmbed,
  getSuccessEmbed,
  justifyEmbedFields,
} from "ui/discord/embed"
import {
  composeDaysSelectMenu,
  composeDiscordSelectionRow,
} from "ui/discord/select-menu"
import {
  authorFilter,
  EmojiKey,
  emojis,
  getAuthor,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  roundFloatNumber,
  TokenEmojiKey,
} from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"
import { formatDigit } from "utils/defi"
import { reply } from "utils/discord"
import {
  buildSwitchViewActionRow,
  composeCollectionInfoEmbed,
} from "../processor"

const dayOpts = [1, 7, 30, 60, 90, 365]
const decimals = (p?: ResponseIndexerPrice) => p?.token?.decimals ?? 0
let originAuthorId: string

export enum ChartStyle {
  Line = "LINE",
  Plot = "PLOT",
}

export function getOriginAuthorId() {
  return originAuthorId
}

export async function handleNFTTickerViews(interaction: ButtonInteraction) {
  await interaction.deferUpdate().catch(() => null)
  const msg = <Message>interaction.message
  const [collectionAddress, _chain, days] = interaction.customId
    .split("-")
    .slice(1)
  const chain = _chain as TokenEmojiKey
  if (interaction.customId.startsWith("nft_ticker_view_chart")) {
    return await viewTickerChart(msg, { collectionAddress, chain, days })
  }
  return await viewTickerInfo(msg, { collectionAddress, chain })
}

async function viewTickerChart(
  msg: Message,
  params: { collectionAddress: string; chain: string; days: string },
) {
  const { collectionAddress, chain, days } = params
  const { messageOptions } = await composeCollectionTickerEmbed({
    msg,
    collectionAddress,
    chain,
    ...(days && { days: +days }),
    chartStyle: ChartStyle.Plot,
  })
  return { messageOptions }
  // await msg.edit(messageOptions)
}

async function viewTickerInfo(
  msg: Message,
  params: { collectionAddress: string; chain: TokenEmojiKey },
) {
  const { collectionAddress, chain } = params
  const { messageOptions } = await composeCollectionInfoEmbed(
    msg,
    collectionAddress,
    chain,
  )
  return { messageOptions: { ...messageOptions, files: [] } }
  // await msg.edit(messageOptions)
  // await msg.removeAttachments()
}

async function composeCollectionTickerEmbed({
  msg,
  collectionAddress,
  chain,
  days = 90,
  chartStyle,
}: {
  msg: Message | CommandInteraction
  collectionAddress: string
  chain: string
  days?: number
  chartStyle: ChartStyle
}) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(days, "day").unix() * 1000
  const {
    data,
    ok,
    log,
    curl,
    status = 500,
    error,
  } = await community.getNFTCollectionTickers({
    collectionAddress,
    from,
    to,
  })
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: curl,
      description: log,
      status,
      error,
    })
  }
  // collection is not exist, mochi has not added it yet
  if (!data) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "The collection does not exist. Please choose another one.",
    })
  }

  const {
    items,
    owners,
    name,
    collection_image,
    total_volume,
    floor_price,
    last_sale_price,
    price_change_30d,
  } = data

  const floorPriceAmount = Number(
    (+(floor_price?.amount ?? 0) / Math.pow(10, decimals(floor_price))).toFixed(
      3,
    ),
  )
  const totalVolumeAmount = Number(
    (
      +(total_volume?.amount ?? 0) / Math.pow(10, decimals(floor_price))
    ).toFixed(3),
  )
  const lastSalePriceAmount = Number(
    (
      +(last_sale_price?.amount ?? 0) / Math.pow(10, decimals(last_sale_price))
    ).toFixed(3),
  )
  const priceToken =
    (floor_price?.token?.symbol?.toUpperCase() as TokenEmojiKey) ?? ""
  const marketcap = floorPriceAmount * (items ?? 0)
  const getChangePercentage = (changeStr: string | undefined) => {
    const change = changeStr ? +changeStr : 0
    const trend =
      change > 0
        ? getEmoji("ARROW_UP")
        : change === 0
        ? ""
        : getEmoji("ARROW_DOWN")
    return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
  }

  const fields = [
    {
      name: `${getEmoji("CASH")} Floor price`,
      value: `${formatDigit({
        value: floorPriceAmount,
        shorten: true,
      })} ${getEmojiToken(priceToken)}`,
    },
    {
      name: `${getEmoji("NFT2")} Holders`,
      value: `${owners}`,
    },
    {
      name: `${getEmoji("CHART")} Market cap`,
      value: `${formatDigit({
        value: marketcap,
        shorten: true,
      })} ${getEmojiToken(priceToken)}`,
    },
    {
      name: `Last sale`,
      value: `${formatDigit({
        value: lastSalePriceAmount,
        shorten: true,
      })} ${getEmojiToken(priceToken)}`,
    },
    {
      name: "Total supply",
      value: `${items}`,
    },
    {
      name: "Volume",
      value: `${formatDigit({
        value: totalVolumeAmount,
        shorten: true,
      })} ${getEmojiToken(priceToken)}`,
    },
    {
      name: "Change (M1)",
      value: getChangePercentage(price_change_30d),
    },
    {
      name: "Chain",
      value: priceToken,
    },
    {
      name: "Contract",
      value: `[Link](${HOMEPAGE_URL})`,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const collectionImage = collection_image ?? getEmojiURL(emojis["NFTS"])
  const embed = composeEmbedMessage(null, {
    author: [`${name}`, collectionImage],
    image: "attachment://chart.png",
  }).addFields(fields)

  const chart = await renderNftTickerChart({ data, chartStyle })
  const selectRow = composeDaysSelectMenu("nft_ticker_selection", dayOpts, 90)
  const buttonRow = buildSwitchViewActionRow("ticker", {
    collectionAddress,
    days: days ?? 7,
    chain,
  })
  return {
    messageOptions: {
      files: chart ? [chart] : [],
      embeds: [justifyEmbedFields(embed, 3)],
      components: [selectRow, buttonRow],
    },
    selectMenuCollector: {
      handler: handler(chartStyle),
    },
  } as RunResult<MessageOptions>
}

async function renderNftTickerChart({
  collectionAddress,
  days = 90,
  data,
  chartStyle,
}: {
  collectionAddress?: string
  days?: number
  data?: ResponseIndexerNFTCollectionTickersData
  chartStyle: ChartStyle
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
  let chart: Buffer
  switch (chartStyle) {
    case ChartStyle.Line: {
      const chartData = data.tickers.prices.map(
        (p) => +(p.amount ?? 0) / Math.pow(10, decimals(p)),
      )
      chart = await renderChartImage({
        chartLabel: `Floor price (${token}) | ${fromLabel} - ${toLabel}`,
        labels: data.tickers.times,
        data: chartData,
      })
      break
    }
    case ChartStyle.Plot: {
      const prices = data.tickers.prices.map(
        (p) => +(p.amount ?? 0) / Math.pow(10, decimals(p)),
      )
      const times = data.tickers.timestamps ?? []
      let plotChartData: { x: number; y: number }[]
      if (prices.length < times.length) {
        plotChartData = prices.map((value, index) => {
          return {
            x: times[index],
            y: value,
          }
        })
      } else {
        plotChartData = times.map((value, index) => {
          return {
            x: value,
            y: prices[index],
          }
        })
      }
      chart = await renderPlotChartImage({
        chartLabel: `Floor price (${token}) | ${fromLabel} - ${toLabel}`,
        data: plotChartData,
      })
      break
    }
  }
  return new MessageAttachment(chart, "chart.png")
}

const handler: (chartStyle: ChartStyle) => InteractionHandler =
  (chartStyle) => async (msgOrInteraction) => {
    const interaction = msgOrInteraction as SelectMenuInteraction
    await interaction.deferUpdate().catch(() => null)
    if (interaction.user.id !== originAuthorId) {
      return {
        messageOptions: {},
      }
    }
    const { message } = <{ message: Message }>interaction
    const input = interaction.values[0]
    const [collectionAddress, days] = input.split("_")

    const chart = await renderNftTickerChart({
      collectionAddress,
      days: +days,
      chartStyle: chartStyle,
    })

    // update chart image
    const [embed] = message.embeds
    await message.removeAttachments()
    embed.setImage("attachment://chart.png")

    const selectMenu = message.components[0].components[0] as MessageSelectMenu
    selectMenu.options.forEach(
      (opt, i) => (opt.default = i === dayOpts.indexOf(+days)),
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
      interactionHandlerOptions: {
        handler: handler(chartStyle),
      },
    }
  }

export async function handleNftTicker(
  msg: Message | CommandInteraction,
  symbol: string,
  chartStyle: ChartStyle,
) {
  symbol = symbol.toUpperCase()
  originAuthorId = getAuthor(msg).id
  const {
    data: suggestions,
    ok,
    log,
    curl,
    status = 500,
    error,
  } = await community.getNFTCollectionSuggestions(symbol)
  if (!ok)
    throw new APIError({
      msgOrInteraction: msg,
      curl,
      description: log,
      status,
      error,
    })
  if (!suggestions.length) {
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Collection not found",
      description: `The collection hasn't been supported.\n${pointingright} Please choose one in the supported \`$nft list\`.\n${pointingright} To add your NFT, run \`$nft add\`.`,
    })
  }

  const buttonHandler = async (i: ButtonInteraction) => ({
    ...(await handleNFTTickerViews(i)),
    buttonCollector: { handler: buttonHandler },
  })
  if (suggestions.length === 1) {
    const response = {
      ...(await composeCollectionTickerEmbed({
        msg,
        collectionAddress: suggestions[0].address ?? "",
        chain: suggestions[0].chain ?? "",
        chartStyle,
      })),
      buttonCollector: { handler: buttonHandler },
    }
    await reply(msg, response)
    return
  }

  // if default ticker was set then respond
  const getDefaultRes = await config.getGuildDefaultNFTTicker({
    guild_id: msg.guildId ?? "",
    query: symbol,
  })
  if (
    getDefaultRes.ok &&
    getDefaultRes.data.address &&
    getDefaultRes.data.chain_id
  ) {
    const { address, chain_id } = getDefaultRes.data
    const response = {
      ...(await composeCollectionTickerEmbed({
        msg,
        collectionAddress: address,
        chain: chain_id,
        chartStyle,
      })),
      buttonCollector: { handler: buttonHandler },
    }
    await reply(msg, response)
    return
  }

  const options = suggestions.flatMap((s: any, i: number) => {
    const valueMaxLength = 100
    const value = `${symbol}_${s.name}_${s.symbol}_${s.address}_${s.chain}_${s.chain_id}`
    if (value.length > valueMaxLength) return []
    return {
      emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
      label: `💎 ${s.name} (${s.symbol})`,
      value,
    }
  })

  if (!options.length) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Collection not found",
      description:
        "The collection is not supported yet. Please contact us for the support. Thank you!",
    })
  }

  // suggestions
  const multipleEmbed = getMultipleResultEmbed({
    title: `${getEmoji("NFT2")} Mulitple results found`,
    description: `We're not sure which \`${symbol}\`, select one:\n${
      formatDataTable(
        suggestions.map((s) => ({
          name: s.name ?? "Unknown",
          symbol: s.symbol ?? "???",
        })),
        {
          cols: ["name", "symbol"],
          rowAfterFormatter: (f, i) =>
            `${getEmoji(`NUM_${i + 1}` as EmojiKey)}${f}`,
        },
      ).joined
    }`,
    ambiguousResultText: symbol,
    multipleResultText: "",
  })
  const selectRow = composeDiscordSelectionRow({
    customId: `mutliple-results-${msg.id}`,
    options,
    placeholder: "💎 Select a ticker",
  })

  const response: RunResult<MessageOptions> = {
    messageOptions: {
      embeds: [multipleEmbed],
      components: [selectRow],
    },
    selectMenuCollector: {
      handler: async (i) => {
        await i.deferReply({ ephemeral: true })
        const [name, symbol, collectionAddress, chain, chainId] = i.values[0]
          .split("_")
          .slice(1)
        const res: RunResult<MessageOptions> =
          await composeCollectionTickerEmbed({
            msg,
            collectionAddress,
            chain,
            chartStyle,
          })
        await askToSetDefault(i, name, symbol, collectionAddress, chainId)
        return res
      },
    },
    buttonCollector: {
      handler: buttonHandler,
    },
  }
  await reply(msg, response)
}

async function askToSetDefault(
  i: SelectMenuInteraction,
  name: string,
  symbol: string,
  address: string,
  chainId: string,
) {
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `confirm-default_${name}_${symbol}_${address}_${chainId}`,
      emoji: getEmoji("CHECK"),
      style: "SUCCESS",
      label: "Confirm",
    }),
  )
  const ephemeral = await i
    .editReply({
      embeds: [
        composeEmbedMessage(null, {
          title: "Set default NFT symbol",
          description: `Do you want to set **${symbol}** as the default value for this command?\nNo further selection next time use command`,
        }),
      ],
      components: [actionRow],
    })
    .then((m) => m as Message)
    .catch(() => null)
  ephemeral
    ?.createMessageComponentCollector({
      componentType: "BUTTON",
      filter: authorFilter(i.user.id),
      max: 1,
    })
    .on("collect", async (i) => {
      await i.deferUpdate()
      await setDefaultNFTTicker(i)
    })
}

async function setDefaultNFTTicker(i: ButtonInteraction) {
  const [name, symbol, collectionAddress, chainId] = i.customId
    .split("_")
    .slice(1)
  await config.setGuildDefaultNFTTicker({
    guild_id: i.guildId ?? "",
    symbol,
    collection_address: collectionAddress,
    chain_id: +chainId,
  })
  const embed = getSuccessEmbed({
    msg: i.message as Message,
    title: "Default NFT ticker ENABLED",
    description: `Next time your server members use \`$nft ticker\` with \`${symbol}\`, **${name}** will be the default selection`,
  })
  await i.editReply({ embeds: [embed], components: [] }).catch(() => null)
}
