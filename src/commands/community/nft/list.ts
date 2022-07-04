import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import {
  drawAvatarWithUrl,
  drawRectangle,
  heightOf,
  widthOf,
} from "utils/canvas"
import { createCanvas, loadImage } from "canvas"
import { CircleleStats, RectangleStats } from "types/canvas"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import Community from "adapters/community"
import {
  emojis,
  getEmojiURL,
  handleTextOverflow,
  thumbnails,
} from "utils/common"
import { NFTCollection } from "types/community"

async function renderSupportedNFTList(collectionList: NFTCollection[]) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 870,
    },
    y: {
      from: 0,
      to: 670,
    },
    w: 0,
    h: 0,
    pt: 10,
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

  // Title row
  const moduleTitleStr = "Supported NFT Collections"
  const heartIcon = {
    w: 40,
    h: 35,
    mr: 15,
  }
  const moduleTitle = {
    x: heartIcon.w + heartIcon.mr,
    y: container.pt,
    mb: 50,
  }

  moduleTitle.y +=
    heightOf(ctx, moduleTitleStr) +
    (heartIcon.h - heightOf(ctx, moduleTitleStr)) / 2
  const heartImg = await loadImage(getEmojiURL(emojis["HEART"]))

  ctx.drawImage(
    heartImg,
    container.x.from,
    container.pt,
    heartIcon.w,
    heartIcon.h
  )

  ctx.font = "bold 33px Whitney"
  ctx.fillStyle = "white"
  ctx.fillText(moduleTitleStr, moduleTitle.x, moduleTitle.y)

  // split column
  const midIdx = Math.ceil(collectionList.length / 2)
  const firstCol = collectionList.splice(0, midIdx)
  const secondCol = collectionList.splice(-midIdx)

  const fixedCollectionNameHeight = 24
  const fixedChainNameHeight = 26
  const cltIconConf = {
    w: 30,
    h: 30,
    mr: 20,
  }
  // render 1st col items
  const rowIn1stCol = {
    x: container.x.from,
    y: moduleTitle.y + moduleTitle.mb,
    h: cltIconConf.h,
    mb: 20,
  }

  const clt1stColConf = {
    x: rowIn1stCol.x + cltIconConf.w + cltIconConf.mr,
    y: moduleTitle.y + moduleTitle.mb,
    mr: 10,
    mb: 50,
  }
  ctx.font = "27px Whitney"
  for (const item of firstCol) {
    const collectionName = item.name
      ? `${handleTextOverflow(
          ctx,
          item.name,
          250
        )} (${item.symbol?.toUpperCase()})`
      : "No data"
    const chainName = item?.chain?.name
      ? handleTextOverflow(ctx, item?.chain?.name, 320)
      : "No data"
    const imageURL = item.image ? item.image : thumbnails.PROFILE

    // collection name
    clt1stColConf.y +=
      fixedCollectionNameHeight +
      (cltIconConf.h - fixedCollectionNameHeight) / 2

    const conf: CircleleStats = {
      x: rowIn1stCol.x + 20,
      y: clt1stColConf.y - 10,
      radius: 20,
    }
    await drawAvatarWithUrl(ctx, conf, imageURL)

    ctx.font = "bold 27px Whitney"
    ctx.fillStyle = "white"
    ctx.fillText(collectionName, clt1stColConf.x, clt1stColConf.y)

    // chain name
    const chainNameConf = {
      x: rowIn1stCol.x,
      y: clt1stColConf.y + clt1stColConf.mb,
      mb: 20,
    }

    ctx.font = "27px Whitney"
    const rectHeight = 40
    const rectWidth = widthOf(ctx, chainName) + 10
    ctx.fillStyle = "#0F0F10"
    ctx.fillRect(chainNameConf.x, clt1stColConf.y + 20, rectWidth, rectHeight)
    ctx.fillStyle = "white"
    ctx.fillText(chainName, chainNameConf.x + 5, chainNameConf.y)
    clt1stColConf.y += fixedChainNameHeight + chainNameConf.mb + rectHeight
    ctx.restore()
  }

  // render 2nd col items
  const rowIn2ndCol = {
    x: 440,
    y: moduleTitle.y + moduleTitle.mb,
    h: cltIconConf.h,
    mb: 20,
  }

  const clt2ndColConf = {
    x: rowIn2ndCol.x + cltIconConf.w + cltIconConf.mr,
    y: moduleTitle.y + moduleTitle.mb,
    mr: 10,
    mb: 50,
  }
  ctx.font = "27px Whitney"
  for (const item of secondCol) {
    const collectionName = item.name
      ? `${handleTextOverflow(
          ctx,
          item.name,
          250
        )} (${item.symbol?.toUpperCase()})`
      : "No data"
    const chainName = item?.chain?.name
      ? handleTextOverflow(ctx, item?.chain?.name, 320)
      : "No data"
    const imageURL = item.image ? item.image : thumbnails.PROFILE

    // collection name
    clt2ndColConf.y +=
      fixedCollectionNameHeight +
      (cltIconConf.h - fixedCollectionNameHeight) / 2

    const conf: CircleleStats = {
      x: rowIn2ndCol.x + 20,
      y: clt2ndColConf.y - 10,
      radius: 20,
    }
    await drawAvatarWithUrl(ctx, conf, imageURL)

    ctx.font = "bold 27px Whitney"
    ctx.fillStyle = "white"
    ctx.fillText(collectionName, clt2ndColConf.x, clt2ndColConf.y)

    // chain name
    const chainNameConf = {
      x: rowIn2ndCol.x,
      y: clt2ndColConf.y + clt2ndColConf.mb,
      mb: 20,
    }

    ctx.font = "27px Whitney"
    const rectHeight = 40
    const rectWidth = widthOf(ctx, chainName) + 10
    ctx.fillStyle = "#0F0F10"
    ctx.fillRect(chainNameConf.x, clt2ndColConf.y + 20, rectWidth, rectHeight)
    ctx.fillStyle = "white"
    ctx.fillText(chainName, chainNameConf.x + 5, chainNameConf.y)
    clt2ndColConf.y += fixedChainNameHeight + chainNameConf.mb + rectHeight
    ctx.restore()
  }

  return new MessageAttachment(canvas.toBuffer(), "nftlist.png")
}

async function composeNFTListEmbed(msg: Message, pageIdx: number) {
  const { data, page, size, total } = await Community.getNFTCollections({
    page: pageIdx,
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
    image: "attachment://nftlist.png",
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(page, totalPage),
      files: [await renderSupportedNFTList(data.slice(0, 10))],
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
    listenForPaginateAction(reply, msg, composeNFTListEmbed)
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
