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
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import { NFTCollection } from "types/community"

async function renderSupportedNFTList(collectionList: NFTCollection[]) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 870,
    },
    y: {
      from: 0,
      to: 600,
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

  const fixedCollectionNameHeight = 24
  const fixedChainNameHeight = 26
  const cltIconConf = {
    w: 30,
    h: 30,
    mr: 20,
  }
  ctx.font = "27px Whitney"
  let columnY = container.pt

  collectionList = collectionList.filter((val: NFTCollection) => val.name)
  for (let idx = 0; idx < collectionList.length; idx++) {
    const item = collectionList[idx]
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
      ? handleTextOverflow(ctx, item?.chain?.name.trim(), 320)
      : "TBD"
    const imageURL = item.image ? item.image : thumbnails.PROFILE

    const xStart = idx % 2 === 0 ? container.x.from : 440
    const colConfig = {
      x: xStart + cltIconConf.w + cltIconConf.mr,
      y: container.pt,
      mr: 10,
      mb: 50,
    }

    // collection name
    if (idx % 2 === 0) {
      columnY +=
        fixedCollectionNameHeight +
        (cltIconConf.h - fixedCollectionNameHeight) / 2
    }

    const conf: CircleleStats = {
      x: xStart + 20,
      y: columnY - 10,
      radius: 20,
    }
    await drawAvatarWithUrl(ctx, conf, imageURL)

    ctx.font = "bold 27px Whitney"
    ctx.fillStyle = "white"
    ctx.fillText(collectionName, colConfig.x, columnY)

    // chain name
    const rectHeight = 40
    const rectWidth =
      widthOf(ctx, chainName) > 200
        ? widthOf(ctx, chainName) - 6
        : widthOf(ctx, chainName) + 6
    const chainNameConf = {
      x: xStart,
      y: columnY + colConfig.mb,
      mb: 20,
    }

    const rectStats: RectangleStats = {
      x: {
        from: chainNameConf.x,
        to: chainNameConf.x + rectWidth,
      },
      y: {
        from: columnY + 20,
        to: columnY + 20 + rectHeight,
      },
      w: rectWidth,
      h: rectHeight,
      radius: 2,
      bgColor: "#0F0F10",
    }

    ctx.font = "27px Whitney"
    drawRectangle(ctx, rectStats, "#0F0F10")
    ctx.fillStyle = "#BFBFBF"
    ctx.fillText(chainName, chainNameConf.x + 5, chainNameConf.y)
    if (idx % 2 === 1) {
      columnY += fixedChainNameHeight + chainNameConf.mb + rectHeight
    }
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
    author: ["Supported NFT Collections", getEmojiURL(emojis["HEART"])],
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
