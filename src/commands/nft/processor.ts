import community from "adapters/community"
import { EmbedFieldData, Message, MessageAttachment } from "discord.js"
import { APIError, InternalError } from "errors"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  getMarketplaceCollectionUrl,
  shortenHashOrAddress,
  thumbnails,
} from "utils/common"
import { API_BASE_URL } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  justifyEmbedFields,
} from "discord/embed/ui"
import { buildSwitchViewActionRow, getOriginAuthorId } from "./ticker/processor"
import { getExitButton } from "discord/button/ui"
import { CircleleStats, RectangleStats } from "types/canvas"
import { NFTCollection } from "types/community"
import { drawCircleImage, drawRectangle, loadImages } from "canvas/draw"
import { Image, createCanvas } from "canvas"
import { widthOf } from "canvas/calculator"
import { handleTextOverflow } from "canvas/text"

const buildDiscordMessage = (
  msg: Message | undefined,
  title: string,
  description: string,
  err = true
) => {
  if (err) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            title: title,
            description: description,
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: title,
          description: description,
        }),
      ],
    },
  }
}

export async function callAPI(
  address: string,
  chainId: string,
  userId: string,
  guildId: string,
  msg: Message | undefined,
  priorityFlag: boolean
) {
  // create store collection payload
  const collection = {
    chain_id: chainId,
    address: address,
    author: userId,
    guild_id: guildId,
    message_id: msg?.id,
    channel_id: msg?.channelId,
    priority_flag: priorityFlag,
  }
  // run store collection API
  const respCollection = await fetch(`${API_BASE_URL}/nfts/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collection),
  })
  // get supported chain
  const respChain = await fetch(`${API_BASE_URL}/nfts/supported-chains`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  return { storeCollectionRes: respCollection, supportedChainsRes: respChain }
}

export async function toEmbed(
  storeCollectionRes: Response,
  supportedChainsRes: Response,
  msg?: Message | undefined
) {
  // get response and show discord message
  const dataCollection = await storeCollectionRes.json()
  const error = dataCollection.error
  const dataChain = await supportedChainsRes.json()
  switch (storeCollectionRes.status) {
    case 200:
      return buildDiscordMessage(
        msg,
        "NFT",
        "Successfully add new collection to queue",
        false
      )
    case 500:
      return buildDiscordMessage(msg, "NFT", "Internal Server Error")
    default:
      if (
        error.includes(
          "Cannot get name and symbol of contract: This collection does not support collection name"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection name."
        )
      } else if (
        error.includes(
          "Cannot get name and symbol of contract: This collection does not support collection symbol"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection symbol."
        )
      } else if (
        error.includes(
          "Cannot get name and symbol of contract: no contract code at given address"
        )
      ) {
        throw new InternalError({
          message: msg,
          title: "Can't find the NFT collection",
          description:
            "The NFT Address and NFT Chain must be valid. Go to the collection's official website/ marketplace to find this information. ",
        })
      } else if (error.includes("Already added. Nft is in sync progress")) {
        return buildDiscordMessage(
          msg,
          "Existing Collection",
          "Please add another one or view the collection by `$nft <collection_symbol> <token_id>`."
        )
      } else if (error.includes("block number not synced yet")) {
        return buildDiscordMessage(msg, "NFT", "Block number is not in sync.")
      } else if (error.includes("Already added. Nft is done with sync")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Already added. Nft is done with sync"
        )
      } else if (error.includes("chain is not supported/invalid")) {
        // add list chain to description
        const listChainSupportedPrefix = `List chain supported:\n`
        let listChainSupported = ""
        for (const chainItm of dataChain.data) {
          listChainSupported = listChainSupported + `${chainItm}\n`
        }
        const listChainDescription =
          `Chain is not supported. ` +
          listChainSupportedPrefix +
          "```\n" +
          listChainSupported +
          "```"
        return buildDiscordMessage(msg, "NFT", listChainDescription)
      } else if (
        error.includes("duplicate key value violates unique constraint")
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection is already added"
        )
      } else if (error.includes("No metadata found")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Cannot found metadata for this collection"
        )
      } else {
        return buildDiscordMessage(msg, "NFT", error)
      }
  }
}

export async function composeCollectionInfoEmbed(
  msg: Message,
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
    throw new InternalError({
      message: msg,
      description: "The collection does not exist. Please choose another one.",
    })
  }
  const symbol = `${data.symbol?.toUpperCase() ?? "-"}`
  const address = data.address
    ? `[\`${shortenHashOrAddress(
        data.address
      )}\`](${getMarketplaceCollectionUrl(data.address)})`
    : "-"
  const name = `${data.name ?? "-"}`
  const desc = `${data.description ?? "-"}`
  const discord = data.discord
    ? `[${getEmoji("discord")}](${data.discord})`
    : ""
  const twitter = data.twitter
    ? `[${getEmoji("twitter")}](${data.twitter})`
    : ""
  const website = data.website ? `[🌐](${data.website})` : ""
  let more = "-"
  if (discord || twitter || website) {
    more = `${discord} ${twitter} ${website}`
  }
  const ercFormat = `${data.erc_format ?? "-"}`
  const marketplaces = data.marketplaces?.length
    ? data.marketplaces.map((m: string) => getEmoji(m)).join(" ")
    : "-"

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
      name: "Find More",
      value: more,
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
  }).addComponents(getExitButton(getOriginAuthorId()))
  return {
    messageOptions: {
      embeds: [justifyEmbedFields(embed, 3)],
      components: [buttonRow],
    },
  }
}

// render canvas for nft list and nft recent
export async function renderSupportedNFTList(collectionList: NFTCollection[]) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 870,
    },
    y: {
      from: 0,
      to: 420,
    },
    w: 0,
    h: 0,
    pt: 0,
    pl: 30,
    radius: 30,
    bgColor: "rgba(0, 0, 0, 0)", // transparent
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")

  // background
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()
  ctx.restore()

  const fixedCollectionNameHeight = 24
  // const fixedChainNameHeight = 26
  const iconConfig = {
    w: 30,
    h: 30,
    mr: 20,
  }
  ctx.font = "27px Whitney"
  let columnY = container.pt ?? 0

  collectionList = collectionList
    .filter((col) => !!col.name)
    .map((col) => {
      col.image = col.image ? col.image : thumbnails.PROFILE
      return col
    })

  const images: Record<string, Image> = loadImages(
    collectionList.map((col) => col.image)
  )
  collectionList.forEach((item, idx) => {
    const colMaxWidth = 300
    const symbolName = item.symbol?.toUpperCase()
    const cName = item.name
    const symbolNameWidth = widthOf(ctx, symbolName)

    let collectionName: string
    if (symbolNameWidth < colMaxWidth) {
      const maxColNameWidth = colMaxWidth - symbolNameWidth
      collectionName =
        handleTextOverflow(ctx, cName, maxColNameWidth) +
        ` (${item.symbol?.toUpperCase()})`
    } else {
      collectionName =
        handleTextOverflow(ctx, cName, 80) +
        ` (${handleTextOverflow(ctx, item.symbol?.toUpperCase(), 200)})`
    }

    const xStart = idx % 2 === 0 ? container.x.from : 440
    const colConfig = {
      x: xStart + iconConfig.w + iconConfig.mr,
      y: container.pt,
      mr: 10,
      mb: 50,
    }

    // collection name
    if (idx % 2 === 0) {
      columnY +=
        fixedCollectionNameHeight +
        (iconConfig.h - fixedCollectionNameHeight) / 2 +
        20
    }

    const conf: CircleleStats = {
      x: xStart + 20,
      y: columnY - 10,
      radius: 20,
    }
    if (images[item.image]) {
      drawCircleImage({ ctx, stats: conf, image: images[item.image] })
    }

    ctx.font = "semibold 27px Whitney"
    ctx.fillStyle = "white"
    ctx.fillText(collectionName, colConfig.x, columnY)

    ctx.restore()
  })

  return new MessageAttachment(canvas.toBuffer(), "nftlist.png")
}
