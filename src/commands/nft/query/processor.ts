import community from "adapters/community"
import config from "adapters/config"
import dayjs from "dayjs"
import {
  ButtonInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageOptions,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { APIError } from "errors"
import {
  ResponseIndexerNFTCollectionTickersData,
  ResponseNftMetadataAttrIcon,
} from "types/api"
import { NFTSymbol } from "types/config"
import { renderChartImage } from "ui/canvas/chart"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
  justifyEmbedFields,
} from "ui/discord/embed"
import { getSuggestionComponents } from "ui/discord/select-menu"
import {
  authorFilter,
  capFirst,
  capitalizeFirst,
  emojis,
  getCompactFormatedNumber,
  getEmoji,
  getEmojiURL,
  getMarketplaceNftUrl,
  getTimeFromNowStr,
  isValidHttpUrl,
  maskAddress,
  roundFloatNumber,
  shortenHashOrAddress,
} from "utils/common"
import { DOT } from "utils/constants"
import { wrapError } from "utils/wrap-error"
import {
  composeCollectionInfoEmbed,
  composeCollectionSoulboundEmbed,
  formatPriceWeiToEther,
} from "../processor"

const rarityColors: Record<string, string> = {
  COMMON: "#939393",
  UNCOMMON: "#22d489",
  RARE: "#02b3ff",
  EPIC: "#9802f6",
  LEGENDARY: "#ff8001",
  MYTHIC: "#ed2939",
}

let icons: ResponseNftMetadataAttrIcon[]

function getRarityEmoji(rarity: string) {
  const rarities = Object.keys(rarityColors)
  rarity = rarities[rarities.indexOf(rarity.toUpperCase())] ?? "common"
  return Array.from(Array(4).keys())
    .map((k) => getEmoji(`${rarity}${k + 1}`))
    .join("")
}

function getIcon(
  iconList: ResponseNftMetadataAttrIcon[],
  iconName: string
): string {
  if (!iconList) {
    return getEmoji(iconName)
  }
  const icon = iconList.find(
    (i) => i.trait_type?.toLowerCase() === iconName.toLowerCase()
  )

  if (icon) {
    return icon.discord_icon ?? ""
  }

  return getEmoji(iconName)
}

const txHistoryEmojiMap: Record<string, string> = {
  sold: getEmoji("cash"),
  transfer: getEmoji("right_arrow"),
  cancelled: getEmoji("revoke"),
  listing: getEmoji("listing"),
}

export function buildSwitchViewActionRow(
  currentView: string,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: string
) {
  const row = new MessageActionRow()
  // TODO(trkhoi): handle aptos address too long
  if (chain === "apt") {
    const nftButton = new MessageButton({
      label: "NFT",
      emoji: getEmoji("NFTS"),
      customId: `nft-view/nft/${symbol}/${tokenId}/${chain}`,
      style: "SECONDARY",
      disabled: currentView === "nft",
    })
    row.addComponents([nftButton])
    return row
  } else {
    let customIdNftCollectionInfo = `nft-view/info/${symbol}/${collectionAddress}/${tokenId}/${chain}`
    let customIdNftTicker = `nft-view/ticker/${symbol}/${collectionAddress}/${tokenId}/${chain}`
    if (chain === "sol") {
      collectionAddress = collectionAddress.split("solscan-")[1]
      customIdNftCollectionInfo = `nft-view/info//${collectionAddress}/${tokenId}/${chain}`
      customIdNftTicker = `nft-view/ticker//${collectionAddress}/${tokenId}/${chain}`
    }
    const nftButton = new MessageButton({
      label: "NFT",
      emoji: getEmoji("NFTS"),
      customId: `nft-view/nft/${symbol}/${collectionAddress}/${tokenId}/${chain}`,
      style: "SECONDARY",
      disabled: currentView === "nft",
    })
    const tickerButton = new MessageButton({
      label: "Ticker",
      emoji: getEmoji("ANIMATED_CHART_INCREASE", true),
      customId: customIdNftTicker,
      style: "SECONDARY",
      disabled: currentView === "ticker",
    })
    const collectionInfoButton = new MessageButton({
      label: "Collection Info",
      emoji: getEmoji("MAG"),
      customId: customIdNftCollectionInfo,
      style: "SECONDARY",
      disabled: currentView === "info",
    })

    row.addComponents([nftButton, tickerButton, collectionInfoButton])

    // currently support SAN collection first
    // TODO(trkhoi): refactor for generic
    if (collectionAddress === "0x33333333333371718A3C2bB63E5F3b94C9bC13bE") {
      const soulboundButton = new MessageButton({
        label: "Soulbound",
        emoji: emojis.SOULBOUND,
        customId: `nft-view/soulbound/${symbol}/${collectionAddress}/${tokenId}/${chain}`,
        style: "SECONDARY",
        disabled: currentView === "soulbound",
      })
      row.addComponents([soulboundButton])
    }
    return row
  }
}

export function collectButton(msg: Message, originMsg: Message) {
  return msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(originMsg.author.id),
    })
    .on("collect", async (i) => {
      wrapError(originMsg, async () => {
        await switchView(i, originMsg)
      })
    })
    .on("end", () => {
      msg.edit({ components: [] }).catch(() => null)
    })
}

async function switchView(i: ButtonInteraction, msg: Message) {
  if (i.customId.startsWith("suggestion-button")) return
  let messageOptions: MessageOptions
  const [currentView, symbol, collectionAddress, tokenId, chain] = i.customId
    .split("/")
    .slice(1)
  let hashCollectionAddress = collectionAddress
  if (chain === "sol") {
    hashCollectionAddress = "solscan-" + collectionAddress
  }
  switch (currentView) {
    case "info":
      messageOptions = await composeCollectionInfo(
        msg,
        symbol,
        hashCollectionAddress,
        tokenId,
        chain
      )
      break
    case "ticker":
      messageOptions = await composeNFTTicker(
        msg,
        symbol,
        collectionAddress,
        tokenId,
        chain
      )
      break
    case "soulbound":
      messageOptions = await composeCollectionSoulbound(
        msg,
        symbol,
        collectionAddress,
        tokenId,
        chain
      )
      break
    case "nft":
    default:
      messageOptions = await fetchAndComposeNFTDetail(
        msg,
        symbol,
        collectionAddress,
        tokenId,
        chain
      )
      break
  }
  await i.editReply({ ...messageOptions }).catch(() => null)
}

async function composeCollectionInfo(
  msg: Message,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: string
) {
  const { messageOptions } = await composeCollectionInfoEmbed(
    msg,
    collectionAddress,
    chain
  )
  return {
    ...messageOptions,
    files: [],
    components: [
      buildSwitchViewActionRow(
        "info",
        symbol,
        collectionAddress,
        tokenId,
        chain
      ),
    ],
  }
}

async function composeCollectionSoulbound(
  msg: Message,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: string
) {
  const { messageOptions } = await composeCollectionSoulboundEmbed(
    msg,
    collectionAddress,
    chain
  )
  return {
    ...messageOptions,
    files: [],
    components: [
      buildSwitchViewActionRow(
        "soulbound",
        symbol,
        collectionAddress,
        tokenId,
        chain
      ),
    ],
  }
}

async function renderNftTickerChart(
  data: ResponseIndexerNFTCollectionTickersData
) {
  if (!data?.tickers?.prices || !data?.tickers?.times) {
    return null
  }
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(365, "day").unix() * 1000
  const token = data.last_sale_price?.token?.symbol ?? ""
  const fromLabel = dayjs(from).format("MMMM DD, YYYY")
  const toLabel = dayjs(to).format("MMMM DD, YYYY")
  const chartData = data.tickers.prices.map(
    (p) => +(p.amount ?? 0) / Math.pow(10, p.token?.decimals ?? 0)
  )
  const chart = await renderChartImage({
    chartLabel: `Sold price (${token}) | ${fromLabel} - ${toLabel}`,
    labels: data.tickers.times,
    data: chartData,
  })
  return new MessageAttachment(chart, "chart.png")
}

// Get nft ticker data for 1 year
async function composeNFTTicker(
  msg: Message,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: string
) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(365, "day").unix() * 1000
  const { data, ok, log, curl } = await community.getNFTTickers({
    collectionAddress,
    tokenId,
    from,
    to,
  })
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, curl: curl, description: log })
  }

  // collection is not exist, mochi has not added it yet
  if (!data) {
    return {
      embeds: [
        getErrorEmbed({
          title: "Collection not found",
          description:
            "The collection is not supported yet. Please contact us for the support. Thank you!",
        }),
      ],
    }
  }

  const {
    name,
    image_cdn,
    price_change_30d,
    price_change_90d,
    price_change_365d,
    last_sale_price,
  } = data

  const getChangePercentage = (changeStr: string | undefined) => {
    const change = changeStr ? +changeStr : 0
    const trend =
      change > 0
        ? getEmoji("ANIMATED_CHART_INCREASE", true)
        : change === 0
        ? ""
        : getEmoji("DECREASING")
    return `${trend} ${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`
  }

  const fields = [
    {
      name: "Change (30d)",
      value: getChangePercentage(price_change_30d),
    },
    {
      name: "Change (90d)",
      value: getChangePercentage(price_change_90d),
    },
    {
      name: "Change (1y)",
      value: getChangePercentage(price_change_365d),
    },
    {
      name: `Last sale (${last_sale_price?.token?.symbol})`,
      value: formatPriceWeiToEther(last_sale_price),
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const collectionImage = image_cdn ?? getEmojiURL(emojis["NFTS"])
  const embed = composeEmbedMessage(msg, {
    author: [`${name}`, collectionImage],
    image: "attachment://chart.png",
  }).addFields(fields)

  const chart = await renderNftTickerChart(data)
  const switchViewActionRow = buildSwitchViewActionRow(
    "ticker",
    symbol,
    collectionAddress,
    tokenId,
    chain
  )
  return {
    files: chart ? [chart] : [],
    embeds: [justifyEmbedFields(embed, 3)],
    components: [switchViewActionRow],
  }
}

export async function fetchAndComposeNFTDetail(
  msg: Message,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: string
) {
  const collectionDetailRes = await community.getNFTCollectionDetail({
    collectionAddress,
    queryAddress: true,
  })
  const res = await community.getNFTDetail(
    collectionAddress,
    tokenId,
    msg.guildId ?? "",
    true
  )
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
    })
  }
  const addSuggestioncomponents = addSuggestionIfAny(
    symbol,
    tokenId,
    res.suggestions
  )
  const switchViewActionRow = buildSwitchViewActionRow(
    "nft",
    symbol,
    collectionAddress,
    tokenId,
    chain
  )
  if (
    collectionDetailRes.ok &&
    res.ok &&
    collectionDetailRes.data &&
    res.data
  ) {
    return {
      embeds: [
        await composeNFTDetail(
          res.data,
          msg,
          collectionDetailRes.data.name,
          collectionDetailRes.data.image,
          collectionDetailRes.data.chain?.name
        ),
      ],
      files: [],
      components: [...addSuggestioncomponents, switchViewActionRow],
    }
  }
  return {
    embeds: [
      composeEmbedMessage(msg, {
        title: "NFT Query",
        description: "Token not found",
      }),
    ],
    files: [],
    components: [],
  }
}

export async function composeNFTDetail(
  data: any,
  msg: Message,
  colName: string,
  colImage: string,
  chainName?: string
) {
  if (!icons) {
    const res = await community.getNFTMetadataAttrIcon()
    if (res.ok) {
      icons = res.data
    } else {
      throw new APIError({
        msgOrInteraction: msg,
        curl: res.curl,
        description: res.log,
      })
    }
  }

  const {
    name,
    attributes,
    rarity,
    image,
    image_cdn,
    collection_address,
    token_id,
    owner,
    marketplace = [],
  } = data

  let nftImage = image
  if (!isValidHttpUrl(image)) {
    nftImage = image_cdn ?? ""
  }
  const attributesFiltered = attributes.filter(
    (obj: { trait_type: string }) => {
      return obj.trait_type !== ""
    }
  )

  // handle soulbound
  let soulbound = ``
  const soulboundObj = attributesFiltered.find(
    (obj: { trait_type: string }) => {
      return obj.trait_type === "soulbound"
    }
  )
  if (typeof soulboundObj !== "undefined") {
    if (soulboundObj.value === "True") {
      soulbound = `**SOULBOUND**`
    }
  }

  // set rank, rarity score empty if have data
  const rarityRate = rarity?.rarity
    ? `**${DOT}** ${getRarityEmoji(rarity.rarity)}`
    : ""
  let description = `**[${
    name ?? `${colName}#${token_id}`
  }](${getMarketplaceNftUrl(collection_address, token_id)})**`
  description += owner?.owner_address
    ? ` **・Owner:** \`${shortenHashOrAddress(owner.owner_address)}\``
    : ""
  description += rarity?.rank
    ? `\n\n${getEmoji("ANIMATED_TROPHY", true)}** ・ Rank: ${
        rarity.rank
      } ** ${rarityRate} ${soulbound}`
    : ""

  // Attributes fields
  const attributeFields: EmbedFieldData[] = attributesFiltered
    ? attributesFiltered.map((attr: any) => {
        const val = `${capFirst(attr.value)}\n${attr.frequency ?? ""}`
        return {
          name: `${getIcon(icons, attr.trait_type)} ${capFirst(
            attr.trait_type?.replace("_", " ")
          )}`,
          value: `${val ? val : "-"}`,
          inline: true,
        }
      })
    : []

  let embed = composeEmbedMessage(msg, {
    author: [
      `${capitalizeFirst(colName)}${chainName ? ` (${chainName})` : ""}`,
      ...(colImage.length ? [colImage] : []),
    ],
    description,
    image: nftImage,
    color: rarityColors[rarity?.rarity?.toUpperCase()],
  }).addFields(attributeFields)

  embed = justifyEmbedFields(embed, 3)

  // Tx history fields
  const {
    ok,
    data: activityData,
    log,
    curl,
  } = await community.getNFTActivity({
    collectionAddress: collection_address,
    tokenId: token_id,
  })
  if (!ok) throw new APIError({ msgOrInteraction: msg, curl, description: log })

  const txHistoryTitle = `${getEmoji("swap")} Transaction History`
  const txHistoryValue = (activityData.data ?? [])
    .map((tx) => {
      const event = tx.event_type
      const soldPriceAmount = Math.round(
        +(tx.sold_price_obj?.amount ?? 0) /
          Math.pow(10, tx.sold_price_obj?.token?.decimals ?? 0)
      )

      const toAddress =
        tx.to_address === undefined ? "-" : maskAddress(tx.to_address, 5)
      const time = getTimeFromNowStr(tx.created_time ?? "")
      return `**${
        txHistoryEmojiMap[event?.toLowerCase() ?? ""] ?? DOT
      }** ${capitalizeFirst(event ?? "")} ${soldPriceAmount} ${
        tx.sold_price_obj?.token?.symbol
      } to ${toAddress} (${time})`
    })
    .join("\n")
  const txHistoryFields: EmbedFieldData[] = [
    {
      name: "\u200b",
      value: getEmoji("horizontal_line").repeat(5),
    },
    {
      name: txHistoryTitle,
      value: `${txHistoryValue}`,
    },
  ]
  if (txHistoryValue.length !== 0) embed.addFields(txHistoryFields)

  const firstListing = marketplace[0]
  const restListing = marketplace.slice(1)
  const firstHalf = restListing.slice(0, Math.ceil(restListing.length / 2))
  const secondHalf = restListing.slice(Math.ceil(restListing.length / 2))

  const renderMarket = (m: any) => {
    return `[${getEmoji(m.platform_name)} **${capFirst(m.platform_name)}**](${
      m.item_url
    })\n${getEmoji("reply")}${getEmoji(
      m.payment_token
    )} ${getCompactFormatedNumber(m.listing_price)} (${getEmoji(
      "floorprice"
    )} ${getCompactFormatedNumber(m.floor_price)})`
  }

  const listingFields: EmbedFieldData[] = [
    {
      name: "\u200b",
      value: getEmoji("horizontal_line").repeat(5),
    },
    ...(marketplace.length > 0 && firstListing
      ? [
          {
            name: "Listed on",
            value: `${renderMarket(firstListing)}\n\n${firstHalf
              .map(renderMarket)
              .join("\n\n")}`,
            inline: true,
          },
        ].concat(
          secondHalf.length > 0
            ? [
                {
                  name: "\u200b",
                  value: secondHalf.map(renderMarket).join("\n\n"),
                  inline: true,
                },
              ]
            : []
        )
      : []),
  ]
  if (marketplace.length !== 0) embed.addFields(listingFields)

  return embed
}

export async function setDefaultSymbol(i: ButtonInteraction) {
  const [colAddress, symbol, chain] = i.customId.split("|").slice(1)
  if (!i.guildId) {
    return
  }
  await config.setGuildDefaultSymbol({
    guild_id: i.guildId,
    chain,
    symbol,
    address: colAddress,
  })
  const embed = getSuccessEmbed({
    msg: i.message as Message,
    title: "Default NFT symbol ENABLED",
    description: `Next time your server members use $nft with \`${symbol}\`, **${symbol} (${shortenHashOrAddress(
      colAddress
    )}/${chain.toUpperCase()})** will be the default selection`,
  })
  i.editReply({
    embeds: [embed],
    components: [],
  }).catch(() => null)
}

export function addSuggestionIfAny(
  symbol: string,
  tokenId: string,
  _suggestions?: Array<NFTSymbol>
) {
  const suggestions = _suggestions ?? []
  const duplicatedSymbols =
    suggestions.reduce((acc, s) => acc.add(s.symbol), new Set()).size === 1
  const components = getSuggestionComponents(
    suggestions.map((s, i) => ({
      label: s.name,
      value: `${s.address}/${tokenId}/${symbol}/${s.chain}/${duplicatedSymbols}`,
      emoji:
        i > 8
          ? `${getEmoji(`NUM_${Math.floor(i / 9)}`)}${getEmoji(`NUM_${i % 9}`)}`
          : getEmoji(`NUM_${i + 1}`),
    }))
  )

  return components ? [components] : []
}
