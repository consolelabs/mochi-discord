import {
  ButtonInteraction,
  EmbedFieldData,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageOptions,
} from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { DOT } from "utils/constants"
import {
  composeEmbedMessage,
  composeSimpleSelection,
  getSuccessEmbed,
  getSuggestionComponents,
  getSuggestionEmbed,
  justifyEmbedFields,
  listenForSuggestionAction,
  getErrorEmbed,
} from "utils/discordEmbed"
import community from "adapters/community"
import {
  authorFilter,
  capFirst,
  capitalizeFirst,
  defaultEmojis,
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
} from "utils/common"
import config from "adapters/config"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { NFTSymbol } from "types/config"
import { APIError } from "errors"
import {
  ResponseIndexerNFTCollectionTickersData,
  ResponseIndexerPrice,
  ResponseNftMetadataAttrIcon,
} from "types/api"
import { composeCollectionInfoEmbed } from "./ticker"
import dayjs from "dayjs"
import { renderChartImage } from "utils/canvas"

const rarityColors: Record<string, string> = {
  COMMON: "#939393",
  UNCOMMON: "#22d489",
  RARE: "#02b3ff",
  EPIC: "#9802f6",
  LEGENDARY: "#ff8001",
  MYTHIC: "#ed2939",
}

let icons: ResponseNftMetadataAttrIcon[]

const decimals = (p?: ResponseIndexerPrice) => p?.token?.decimals ?? 0

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
  const icon = iconList.find((i) => i.trait_type === iconName)

  if (icon) {
    return icon.discord_icon ?? ""
  }

  return getEmoji(iconName)
}

const txHistoryEmojiMap: Record<string, string> = {
  sale: getEmoji("cash"),
  transfer: getEmoji("right_arrow"),
  cancelled: getEmoji("revoke"),
  listing: getEmoji("listing"),
}

function buildSwitchViewActionRow(
  currentView: string,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: string
) {
  const row = new MessageActionRow()
  // aptos not have chain yet
  if (chain === "") {
    const nftButton = new MessageButton({
      label: "NFT",
      emoji: emojis.NFT,
      customId: `nft-view/nft/${symbol}/${tokenId}/${chain}`,
      style: "SECONDARY",
      disabled: currentView === "nft",
    })
    row.addComponents([nftButton])
    return row
  } else {
    const nftButton = new MessageButton({
      label: "NFT",
      emoji: emojis.NFT,
      customId: `nft-view/nft/${symbol}/${collectionAddress}/${tokenId}/${chain}`,
      style: "SECONDARY",
      disabled: currentView === "nft",
    })
    const tickerButton = new MessageButton({
      label: "Ticker",
      emoji: emojis.TICKER,
      customId: `nft-view/ticker/${symbol}/${collectionAddress}/${tokenId}/${chain}`,
      style: "SECONDARY",
      disabled: currentView === "ticker",
    })
    const collectionInfoButton = new MessageButton({
      label: "Collection Info",
      emoji: emojis.INFO,
      customId: `nft-view/info/${symbol}/${collectionAddress}/${tokenId}/${chain}`,
      style: "SECONDARY",
      disabled: currentView === "info",
    })

    row.addComponents([nftButton, tickerButton, collectionInfoButton])
    return row
  }
}

function collectButton(msg: Message, originMsg: Message) {
  return msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(originMsg.author.id),
    })
    .on("collect", async (i) => {
      await switchView(i, originMsg)
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
  switch (currentView) {
    case "info":
      messageOptions = await composeCollectionInfo(
        msg,
        symbol,
        collectionAddress,
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
    (p) => +(p.amount ?? 0) / Math.pow(10, decimals(p))
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
    throw new APIError({ message: msg, curl: curl, description: log })
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
    price_change_1d,
    price_change_7d,
    price_change_30d,
  } = data

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

async function fetchAndComposeNFTDetail(
  msg: Message,
  symbol: string,
  collectionAddress: string,
  tokenId: string,
  chain: string
) {
  const collectionDetailRes = await community.getNFTCollectionDetail(
    collectionAddress
  )
  const res = await community.getNFTDetail(
    collectionAddress,
    tokenId,
    msg.guildId ?? ""
  )
  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
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
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
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
    ? `\n\n🏆** ・ Rank: ${rarity.rank} ** ${rarityRate}`
    : ""

  const attributesFiltered = attributes.filter(
    (obj: { trait_type: string }) => {
      return obj.trait_type !== ""
    }
  )

  // Attributes fields
  const attributeFields: EmbedFieldData[] = attributesFiltered
    ? attributesFiltered.map((attr: any) => {
        const val = `${capFirst(attr.value)}\n${attr.frequency ?? ""}`
        return {
          name: `${getIcon(icons, attr.trait_type)} ${capFirst(
            attr.trait_type
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
  if (!ok) throw new APIError({ message: msg, curl, description: log })

  const txHistoryTitle = `${getEmoji("swap")} Transaction History`
  const txHistoryValue = (activityData.data ?? [])
    .map((tx) => {
      const event = tx.event_type
      const fromAddress =
        tx.from_address === undefined ? "-" : maskAddress(tx.from_address, 5)
      const toAddress =
        tx.to_address === undefined ? "-" : maskAddress(tx.to_address, 5)
      const time = getTimeFromNowStr(tx.created_time ?? "")
      return `**${
        txHistoryEmojiMap[event!.toLowerCase()] ?? DOT
      } ${event}** \`${fromAddress}\` to \`${toAddress}\` (${time})`
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

function addSuggestionIfAny(
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

const command: Command = {
  id: "nft_query",
  command: "query",
  brief: "View NFT token info",
  category: "Community",
  getHelpMessage: async () => {
    return {}
  },
  run: async function (msg) {
    // TODO(tuan): refactor set default handler
    const args = getCommandArguments(msg)
    const symbol = args
      .slice(1, args.length - 1)
      .reduce((prev, next) => prev + "%20" + next)
      .toUpperCase()
    const tokenId = args[args.length - 1]
    const res = await community.getNFTDetail(symbol, tokenId, msg.guildId ?? "")

    if (!res.ok) {
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
    }

    let replyMsg: Message | null = null
    // great, we have data
    if (res.data?.collection_address) {
      const collectionDetailRes = await community.getNFTCollectionDetail(symbol)
      if (collectionDetailRes.ok) {
        replyMsg = await msg.reply({
          embeds: [
            await composeNFTDetail(
              res.data,
              msg,
              collectionDetailRes.data.name,
              collectionDetailRes.data.image,
              collectionDetailRes.data.chain?.name
            ),
          ],
          components: [
            ...addSuggestionIfAny(symbol, tokenId),
            buildSwitchViewActionRow(
              "nft",
              symbol,
              res.data.collection_address,
              tokenId,
              collectionDetailRes.data.chain?.short_name ?? ""
            ),
          ],
        })
      }
    } else {
      // ambiguity, check if there is default_symbol first
      if (res.default_symbol) {
        // there is, so we use its collection address to get
        const messageOptions = await fetchAndComposeNFTDetail(
          msg,
          res.default_symbol.name,
          res.default_symbol.address,
          tokenId,
          res.default_symbol.chain
        )
        replyMsg = await msg.reply({ ...messageOptions })
      } else {
        // there isn't, so we continue to check for the `suggestions` property
        // if there is not any suggestion, return error
        if (res.suggestions?.length == 0) {
          replyMsg = await msg.reply({
            embeds: [
              getErrorEmbed({
                msg,
                description:
                  "The collection does not exist. Please choose another one.",
              }),
            ],
          })
        } else {
          const embed = getSuggestionEmbed({
            title: `Multiple results for ${symbol}`,
            msg,
            description: `Did you mean one of these instead:\n\n${composeSimpleSelection(
              (res.suggestions ?? []).map(
                (s) =>
                  `[\`${s.chain.toUpperCase()}\` - \`${s.name} (${
                    s.symbol
                  })\`](${getMarketplaceCollectionUrl(s.address)})`
              )
            )}`,
          })

          replyMsg = await msg.reply({
            embeds: [embed],
            components: [
              ...addSuggestionIfAny(symbol, tokenId, res.suggestions),
            ],
          })
        }
      }
    }

    if (replyMsg) {
      listenForSuggestionAction(replyMsg, msg.author.id, async (value, i) => {
        // ignore if user click to switch view button
        if (i.customId.startsWith("nft-view")) return

        await i.deferUpdate().catch(() => null)
        const [colAddress, tokenId, symbol, chain, hasDuplicatedSymbols] =
          value.split("/")
        const res = await community.getNFTDetail(
          colAddress,
          tokenId,
          msg.guildId ?? ""
        )
        const detailRes = await community.getNFTCollectionDetail(colAddress)

        if (!res.ok || !detailRes.ok) {
          throw new APIError({
            message: msg,
            curl: detailRes.curl,
            description: {
              nftDetail: res.log,
              collectionDetail: detailRes.log,
            },
          })
        } else {
          const shouldAskDefault =
            hasAdministrator(msg.member) &&
            !res.default_symbol &&
            hasDuplicatedSymbols === "true"

          // the token might not be synced yet
          if (!res.data) {
            await replyMsg
              ?.edit({
                embeds: [
                  composeEmbedMessage(null, {
                    title: detailRes?.data?.name ?? "NFT Query",
                    description: "The token is being synced",
                  }),
                ],
              })
              .catch(() => null)
          } else {
            await replyMsg
              ?.edit({
                embeds: [
                  await composeNFTDetail(
                    res.data,
                    msg,
                    detailRes.data.name,
                    detailRes.data.image,
                    detailRes.data.chain?.name
                  ),
                ],
                components: [
                  ...addSuggestionIfAny(symbol, tokenId, res.suggestions),
                  buildSwitchViewActionRow(
                    "nft",
                    symbol,
                    detailRes.data.address,
                    tokenId,
                    detailRes.data.chain?.short_name ?? ""
                  ),
                ],
              })
              .catch(() => null)
          }
          if (shouldAskDefault) {
            const actionRow = new MessageActionRow().addComponents(
              new MessageButton({
                customId: `confirm_symbol|${colAddress}|${symbol}|${chain}|${msg.author.id}`,
                emoji: getEmoji("approve"),
                style: "PRIMARY",
                label: "Confirm",
              })
            )
            const ephemeralMessage = {
              embeds: [
                composeEmbedMessage(msg, {
                  title: "Set default NFT symbol",
                  description: `Do you want to set **${symbol}** as your server default NFT symbol?\nNo further selection next time use \`$nft\``,
                }),
              ],
              components: [actionRow],
            }
            const askDefaultMsg = await msg
              .reply(ephemeralMessage)
              .catch(() => null)

            askDefaultMsg
              ?.createMessageComponentCollector({
                componentType: MessageComponentTypes.BUTTON,
                idle: 60000,
                filter: authorFilter(msg.author.id),
              })
              .on("collect", setDefaultSymbol)
          }
        }
      })

      collectButton(replyMsg, msg)
    }

    return
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
