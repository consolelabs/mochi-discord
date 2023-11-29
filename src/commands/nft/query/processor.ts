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
  SelectMenuInteraction,
} from "discord.js"
import { APIError, InternalError } from "errors"
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
  getSuggestionEmbed,
  justifyEmbedFields,
} from "ui/discord/embed"
import {
  composeSimpleSelection,
  getSuggestionComponents,
} from "ui/discord/select-menu"
import {
  authorFilter,
  capFirst,
  capitalizeFirst,
  EmojiKey,
  emojis,
  getCompactFormatedNumber,
  getEmoji,
  getEmojiURL,
  getMarketplaceCollectionUrl,
  getMarketplaceNftUrl,
  getTimeFromNowStr,
  hasAdministrator,
  isValidHttpUrl,
  maskAddress,
  roundFloatNumber,
  shortenHashOrAddress,
  TokenEmojiKey,
} from "utils/common"
import { DOT } from "utils/constants"
import {
  composeCollectionInfoEmbed,
  composeCollectionSoulboundEmbed,
  formatPriceWeiToEther,
} from "../processor"
import { RunResult } from "types/common"
import { reply } from "utils/discord"
import { lowerCase } from "lodash"

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
    .map((k) => getEmoji(`${rarity}${k + 1}` as EmojiKey))
    .join("")
}

function getIcon(
  iconList: ResponseNftMetadataAttrIcon[],
  iconName: EmojiKey,
): string {
  if (!iconList) {
    return getEmoji(iconName)
  }
  const icon = iconList.find(
    (i) => i.trait_type?.toLowerCase() === iconName.toLowerCase(),
  )

  if (icon) {
    return icon.discord_icon ?? ""
  }

  return getEmoji(iconName)
}

const txHistoryEmojiMap: Record<string, string> = {
  sold: getEmoji("CASH"),
  transfer: getEmoji("RIGHT_ARROW"),
  cancelled: getEmoji("REVOKE"),
  listing: getEmoji("RIGHT_ARROW"),
}

export function buildSwitchViewActionRow(
  currentView: string,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: TokenEmojiKey,
) {
  const row = new MessageActionRow()
  // TODO(trkhoi): handle aptos address too long
  if (chain === "APT" || chain === "SUI") {
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
    if (chain === "SOL") {
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

async function switchView(i: ButtonInteraction, msg: Message) {
  await i.deferUpdate().catch(() => null)

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
        chain as TokenEmojiKey,
      )
      break
    case "ticker":
      messageOptions = await composeNFTTicker(
        msg,
        symbol,
        collectionAddress,
        tokenId,
        chain as TokenEmojiKey,
      )
      break
    case "soulbound":
      messageOptions = await composeCollectionSoulbound(
        msg,
        symbol,
        collectionAddress,
        tokenId,
        chain as TokenEmojiKey,
      )
      break
    case "nft":
    default:
      messageOptions = await fetchAndComposeNFTDetail(
        msg,
        symbol,
        collectionAddress,
        tokenId,
        chain as TokenEmojiKey,
      )
      break
  }
  // await i.editReply({ ...messageOptions }).catch(() => null)
  return { messageOptions }
}

async function composeCollectionInfo(
  msg: Message,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: TokenEmojiKey,
) {
  const { messageOptions } = await composeCollectionInfoEmbed(
    msg,
    collectionAddress,
    chain,
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
        chain,
      ),
    ],
  }
}

async function composeCollectionSoulbound(
  msg: Message,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: TokenEmojiKey,
) {
  const { messageOptions } = await composeCollectionSoulboundEmbed(
    msg,
    collectionAddress,
    chain,
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
        chain,
      ),
    ],
  }
}

async function renderNftTickerChart(
  data: ResponseIndexerNFTCollectionTickersData,
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
    (p) => +(p.amount ?? 0) / Math.pow(10, p.token?.decimals ?? 0),
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
  chain: TokenEmojiKey,
) {
  const to = dayjs().unix() * 1000
  const from = dayjs().subtract(365, "day").unix() * 1000
  const {
    data,
    ok,
    log,
    curl,
    status = 500,
  } = await community.getNFTTickers({
    collectionAddress,
    tokenId,
    from,
    to,
  })
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: curl,
      description: log,
      status,
    })
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
        : getEmoji("ANIMATED_CHART_DECREASE", true)
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
    chain,
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
  chain: TokenEmojiKey,
) {
  const collectionDetailRes = await community.getNFTCollectionDetail({
    collectionAddress,
    queryAddress: true,
  })
  const res = await community.getNFTDetail(
    collectionAddress,
    tokenId,
    msg.guildId ?? "",
    true,
  )
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
    })
  }
  const addSuggestioncomponents = addSuggestionIfAny(
    symbol,
    tokenId,
    res.suggestions,
  )
  const switchViewActionRow = buildSwitchViewActionRow(
    "nft",
    symbol,
    collectionAddress,
    tokenId,
    chain,
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
          collectionDetailRes.data.chain?.name,
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
  chainName?: string,
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
        status: res.status ?? 500,
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
    },
  )

  // handle soulbound
  let soulbound = ``
  const soulboundObj = attributesFiltered.find(
    (obj: { trait_type: string }) => {
      return obj.trait_type === "soulbound"
    },
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
        const val = `${capFirst(attr.value?.replaceAll("_", " "))}\n${
          attr.frequency ?? ""
        }`
        return {
          name: `${getIcon(icons, attr.trait_type)} ${capFirst(
            attr.trait_type?.replaceAll("_", " "),
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
    status = 500,
  } = await community.getNFTActivity({
    collectionAddress: collection_address,
    tokenId: token_id,
  })
  if (!ok)
    throw new APIError({
      msgOrInteraction: msg,
      curl,
      description: log,
      status,
    })

  const txHistoryTitle = `${getEmoji("SWAP")} Transaction History`
  const txHistoryValue = (activityData.data ?? [])
    .map((tx) => {
      const event = tx.event_type
      const soldPriceAmount = Math.round(
        +(tx.sold_price_obj?.amount ?? 0) /
          Math.pow(10, tx.sold_price_obj?.token?.decimals ?? 0),
      )

      const toAddress =
        tx.to_address === undefined ? "-" : maskAddress(tx.to_address, 5)
      const time = getTimeFromNowStr(tx.created_time ?? "")
      return `**${
        txHistoryEmojiMap[event?.toLowerCase() ?? ""] ?? DOT
      }** ${capitalizeFirst(event ?? "")} ${soldPriceAmount} ${tx.sold_price_obj
        ?.token?.symbol} to ${toAddress} (${time})`
    })
    .join("\n")
  const txHistoryFields: EmbedFieldData[] = [
    {
      name: "\u200b",
      value: getEmoji("HORIZONTAL_LINE").repeat(5),
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
    })\n${getEmoji("REPLY")}${getEmoji(
      m.payment_token,
    )} ${getCompactFormatedNumber(m.listing_price)} (${getEmoji(
      "FLOORPRICE",
    )} ${getCompactFormatedNumber(m.floor_price)})`
  }

  const listingFields: EmbedFieldData[] = [
    {
      name: "\u200b",
      value: getEmoji("HORIZONTAL_LINE").repeat(5),
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
            : [],
        )
      : []),
  ]
  if (marketplace.length !== 0) embed.addFields(listingFields)

  return embed
}

export async function setDefaultSymbol(i: ButtonInteraction) {
  const [address, symbol, chain] = i.customId.split("|").slice(1)
  if (!i.guildId) {
    return
  }
  await config.setGuildDefaultSymbol({
    guild_id: i.guildId,
    chain,
    symbol,
    address,
  })
  const embed = getSuccessEmbed({
    msg: i.message as Message,
    title: "Default NFT symbol ENABLED",
    description: `Next time your server members use $nft with \`${symbol}\`, **${symbol} (${shortenHashOrAddress(
      address,
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
  _suggestions?: Array<NFTSymbol>,
) {
  const suggestions = _suggestions ?? []
  const duplicatedSymbols =
    suggestions.reduce((acc, s) => acc.add(s.symbol), new Set()).size === 1
  const components = getSuggestionComponents(
    suggestions.map((s, i) => ({
      label: `${s.chain.toUpperCase()} - ${s.name} (${s.symbol})`,
      value:
        lowerCase(s.chain) !== "sui"
          ? `${s.address}/${tokenId}/${symbol}/${s.chain}/${duplicatedSymbols}`
          : `${s.address}/${tokenId}//${s.chain}/${duplicatedSymbols}`,
      emoji:
        i > 8
          ? `${getEmoji(`NUM_${Math.floor(i / 9)}` as EmojiKey)}${getEmoji(
              `NUM_${i % 9}` as EmojiKey,
            )}`
          : getEmoji(`NUM_${i + 1}` as EmojiKey),
    })),
  )

  return components ? [components] : []
}

async function composeResponse(
  msgOrInteraction: Message,
  symbol: string,
  tokenId: string,
) {
  const nftDetailRes = await community.getNFTDetail(
    symbol,
    tokenId,
    msgOrInteraction.guildId ?? "",
    false,
  )
  if (!nftDetailRes.ok) {
    const { curl, status, log } = nftDetailRes
    if (status == 404) {
      throw new InternalError({
        msgOrInteraction: msgOrInteraction,
        title: "Command error",
        description: "The NFT does not exist. Please choose another one",
      })
    }
    throw new APIError({
      msgOrInteraction,
      curl,
      description: log,
      status: status ?? 500,
    })
  }
  const {
    data: nft,
    suggestions,
    default_symbol: defaultCollection,
  } = nftDetailRes

  // case 1: we have nft data
  if (nft.collection_address) {
    const collectionDetailRes = await community.getNFTCollectionDetail({
      collectionAddress: nft.collection_address,
      queryAddress: true,
    })
    if (!collectionDetailRes.ok) {
      const { curl, log, status = 500 } = collectionDetailRes
      throw new APIError({ msgOrInteraction, curl, description: log, status })
    }
    const { data: collection } = collectionDetailRes

    const embed = await composeNFTDetail(
      nft,
      msgOrInteraction,
      collection.name,
      collection.image,
      collection.chain?.name,
    )
    const buttonRow = buildSwitchViewActionRow(
      "nft",
      symbol,
      nft.collection_address,
      tokenId,
      (collection.chain?.short_name.toUpperCase() as TokenEmojiKey) ?? "",
    )
    return {
      messageOptions: {
        embeds: [embed],
        components: [...addSuggestionIfAny(symbol, tokenId), buttonRow],
      },
      hasSuggestions: true,
    }
  }

  // case 2: ambigous symbol BUT guild has default collection
  if (defaultCollection) {
    const { name, address, chain } = defaultCollection
    const messageOptions = await fetchAndComposeNFTDetail(
      msgOrInteraction,
      name,
      address,
      tokenId,
      chain.toUpperCase() as TokenEmojiKey,
    )
    return { messageOptions, defaultCollection }
  }

  // case 3: ambigous symbol AND no suggestions -> error
  if (!suggestions?.length) {
    throw new InternalError({
      msgOrInteraction,
      title: "Command Error",
      description: "The collection does not exist. Please choose another one.",
    })
  }

  // case 4: suggestions
  const suggestionEmbed = getSuggestionEmbed({
    title: `Multiple results for ${symbol}`,
    msg: msgOrInteraction,
    description: `Did you mean one of these instead:\n\n${composeSimpleSelection(
      (suggestions ?? []).map(
        (s) =>
          `[\`${s.chain.toUpperCase()}\` - \`${s.name} (${
            s.symbol
          })\`](${getMarketplaceCollectionUrl(s.address)})`,
      ),
    )}`,
  })
  const suggestionRow = addSuggestionIfAny(symbol, tokenId, suggestions)
  return {
    messageOptions: {
      embeds: [suggestionEmbed],
      components: suggestionRow,
    },
    hasSuggestions: true,
  }
}

function suggestionHandler(
  msg: Message,
  defaultCollection: NFTSymbol | undefined,
) {
  const handler = async (
    i: SelectMenuInteraction,
  ): Promise<RunResult<MessageOptions>> => {
    const [address, tokenId, symbol, chain, hasDuplicatedSymbols] =
      i.values[0].split("/")
    const shouldAskDefault =
      hasAdministrator(msg.member) &&
      !defaultCollection &&
      hasDuplicatedSymbols === "true"
    await (shouldAskDefault
      ? i.deferReply({ ephemeral: true })
      : i.deferUpdate())
    const nftDetailRes = await community.getNFTDetail(
      address,
      tokenId,
      msg.guildId ?? "",
      true,
    )
    if (!nftDetailRes.ok) {
      const { curl, log, status = 500 } = nftDetailRes
      throw new APIError({
        msgOrInteraction: msg,
        curl,
        description: log,
        status,
      })
    }
    const { data: nft, suggestions } = nftDetailRes
    const collectionDetailRes = await community.getNFTCollectionDetail({
      collectionAddress: address,
      queryAddress: true,
    })
    if (!collectionDetailRes.ok) {
      const { curl, log, status = 500 } = collectionDetailRes
      throw new APIError({
        msgOrInteraction: msg,
        curl,
        description: log,
        status,
      })
    }
    const { data: collection } = collectionDetailRes
    if (!nft) {
      const embed = composeEmbedMessage(null, {
        title: collection.name ?? "NFT Query",
        description: "The token is being synced",
      })
      return { messageOptions: { embeds: [embed] } }
    }

    const response: RunResult<MessageOptions> = {
      messageOptions: {
        embeds: [
          await composeNFTDetail(
            nft,
            msg,
            collection.name,
            collection.image,
            collection.chain?.name,
          ),
        ],
        components: [
          ...addSuggestionIfAny(symbol, tokenId, suggestions),
          buildSwitchViewActionRow(
            "nft",
            symbol,
            collection.address,
            tokenId,
            (collection.chain?.short_name as TokenEmojiKey) ?? "",
          ),
        ],
      },
      selectMenuCollector: { handler },
    }

    // set default
    if (shouldAskDefault) await askToSetDefault(i, address, symbol, chain)
    return response
  }
  return handler
}

async function askToSetDefault(
  i: SelectMenuInteraction,
  address: string,
  symbol: string,
  chain: string,
) {
  const actionRow = new MessageActionRow().addComponents(
    new MessageButton({
      customId: `confirm_symbol|${address}|${symbol}|${chain}`,
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
          description: `Do you want to set **${symbol}** as your server's default NFT collection?\nNo further selection next time use \`$nft ${symbol}\``,
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
      await setDefaultSymbol(i)
    })
}

export async function queryNft(msg: Message, symbol: string, tokenId: string) {
  const { messageOptions, hasSuggestions, defaultCollection } =
    await composeResponse(msg, symbol, tokenId)
  const selectMenuHandler = suggestionHandler(msg, defaultCollection)

  const buttonHandler = async (i: ButtonInteraction) => ({
    ...(await switchView(i, msg)),
    buttonCollector: { handler: buttonHandler },
  })
  const response: RunResult<MessageOptions> = {
    messageOptions,
    ...(hasSuggestions && {
      selectMenuCollector: { handler: selectMenuHandler },
    }),
    buttonCollector: { handler: buttonHandler },
  }
  await reply(msg, response)
}
