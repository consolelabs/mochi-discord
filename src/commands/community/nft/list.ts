import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import {
  drawRectangle,
  widthOf,
  handleTextOverflow,
  loadImages,
  drawCircleImage,
} from "utils/canvas"
import { CircleleStats, RectangleStats } from "types/canvas"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import Community from "adapters/community"
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import { NFTCollection } from "types/community"
import { createCanvas, Image, registerFont } from "canvas"

registerFont("src/assets/fonts/whitneysemibold.otf", {
  family: "Whitney",
  weight: "semibold",
})

async function renderSupportedNFTList(collectionList: NFTCollection[]) {
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
  let columnY = container.pt

  collectionList = collectionList
    .filter((col) => !!col.name)
    .map((col) => {
      col.image = col.image ? col.image : thumbnails.PROFILE
      return col
    })

  const images: Record<string, Image> = await loadImages(
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

async function composeNFTListEmbed(msg: Message, pageIdx: number) {
  const { data, page, size, total } = await Community.getNFTCollections({
    page: pageIdx,
    size: 16,
  })
  if (!data || !data.length) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            description: "No NFT collections found",
          }),
        ],
      },
    }
  }

  const totalPage = Math.ceil(total / size)
  const embed = composeEmbedMessage(msg, {
    author: ["Supported NFT Collections", getEmojiURL(emojis["HEART"])],
    image: `attachment://nftlist.png`,
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(page, totalPage),
      files: [await renderSupportedNFTList(data)],
    },
  }
}

const command: Command = {
  id: "nft_list",
  command: "list",
  brief: "Show list of supported NFTs",
  category: "Community",
  run: async function (msg: Message) {
    const msgOpts = await composeNFTListEmbed(msg, 0)
    const reply = await msg.reply(msgOpts.messageOptions)
    listenForPaginateAction(reply, msg, composeNFTListEmbed, true)
    return {
      messageOptions: null,
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
