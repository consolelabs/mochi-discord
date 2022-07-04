import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import {
  drawAvatarWithUrl,
  drawRectangle,
  widthOf,
  handleTextOverflow,
} from "utils/canvas"
import { createCanvas } from "canvas"
import { CircleleStats, RectangleStats } from "types/canvas"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import Community from "adapters/community"
import { getEmoji, thumbnails } from "utils/common"
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
    bgColor: "#2F3136", // transparent
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
    y: container.pt,
    h: cltIconConf.h,
    mb: 20,
  }

  const clt1stColConf = {
    x: rowIn1stCol.x + cltIconConf.w + cltIconConf.mr,
    y: container.pt,
    mr: 10,
    mb: 50,
  }
  ctx.font = "27px Whitney"
  for (const item of firstCol) {
    const colMaxWidth = 300
    const symbolName = item.symbol?.toUpperCase()
    const cName = item.name ? item.name : ""
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

    const chainName = item?.chain?.name
      ? handleTextOverflow(ctx, item?.chain?.name, 320)
      : "TBD  "
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
    const rectHeight = 40
    const rectWidth = widthOf(ctx, chainName)
    const chainNameConf = {
      x: rowIn1stCol.x,
      y: clt1stColConf.y + clt1stColConf.mb,
      mb: 20,
    }

    const col1stRectStats: RectangleStats = {
      x: {
        from: chainNameConf.x,
        to: chainNameConf.x + rectWidth - 6,
      },
      y: {
        from: clt1stColConf.y + 20,
        to: clt1stColConf.y + 20 + rectHeight,
      },
      w: rectWidth,
      h: rectHeight,
      radius: 8,
      bgColor: "#0F0F10",
    }

    ctx.font = "27px Whitney"
    drawRectangle(ctx, col1stRectStats, "#0F0F10")
    ctx.fillStyle = "#BFBFBF"
    ctx.fillText(chainName, chainNameConf.x + 5, chainNameConf.y)
    clt1stColConf.y += fixedChainNameHeight + chainNameConf.mb + rectHeight
    ctx.restore()
  }

  // render 2nd col items
  const rowIn2ndCol = {
    x: 440,
    y: container.pt,
    h: cltIconConf.h,
    mb: 20,
  }

  const clt2ndColConf = {
    x: rowIn2ndCol.x + cltIconConf.w + cltIconConf.mr,
    y: container.pt,
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
      : ""
    const chainName = item?.chain?.name
      ? handleTextOverflow(ctx, item?.chain?.name, 320)
      : "TBD  "
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
    const rectHeight = 40
    const rectWidth = widthOf(ctx, chainName)
    const chainNameConf = {
      x: rowIn2ndCol.x,
      y: clt2ndColConf.y + clt2ndColConf.mb,
      mb: 20,
    }
    const col2ndRectStats: RectangleStats = {
      x: {
        from: chainNameConf.x,
        to: chainNameConf.x + rectWidth - 6,
      },
      y: {
        from: clt2ndColConf.y + 20,
        to: clt2ndColConf.y + 20 + rectHeight,
      },
      w: rectWidth,
      h: rectHeight,
      radius: 8,
      bgColor: "#0F0F10",
    }
    ctx.font = "27px Whitney"
    drawRectangle(ctx, col2ndRectStats, "#0F0F10")
    ctx.fillStyle = "#BFBFBF"
    ctx.fillText(chainName, chainNameConf.x + 5, chainNameConf.y)
    clt2ndColConf.y += fixedChainNameHeight + chainNameConf.mb + rectHeight
    ctx.restore()
  }

  return new MessageAttachment(canvas.toBuffer(), `nftlist.png`)
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
    title: `${getEmoji("heart")} Supported NFT Collections`,
    image: `attachment://nftlist.png`,
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
