import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import community from "adapters/community"
import { emojis, getEmojiURL } from "utils/common"
import {
  drawRectangle,
  heightOf,
  renderChartImage,
  renderRoundedImage,
  widthOf,
} from "utils/canvas"
import { RectangleStats, RoundedRectangleStats } from "types/canvas"
import { createCanvas, loadImage } from "canvas"

async function renderTicker(msg: Message, data: any) {
  const {
    chain,
    floor_price,
    last_price,
    change1h,
    change24h,
    change7d,
    owner,
    volume,
    item,
    collection_image,
    name,
  } = data
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 960,
    },
    y: {
      from: 0,
      to: 750,
    },
    w: 0,
    h: 0,
    pt: 40,
    pl: 30,
    radius: 30,
    bgColor: "rgba(0, 0, 0, 0)", // transparent
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()
  ctx.restore()

  // Module title
  ctx.font = "bold 35px Whitney"
  ctx.fillStyle = "#FFFFFF"
  const moduleTitleStr = "NFT Collection"
  const moduleTitle = {
    w: widthOf(ctx, moduleTitleStr),
    h: heightOf(ctx, moduleTitleStr),
    x: container.x.from + 60,
    y: container.pt,
    mb: 60,
  }
  ctx.fillText(moduleTitleStr, moduleTitle.x, moduleTitle.y)

  const cupIcon = {
    image: await loadImage(getEmojiURL(emojis.CUP)),
    h: 35,
    w: 45,
    x: container.x.from,
    y: 10,
    mb: 60,
  }
  ctx.drawImage(cupIcon.image, cupIcon.x, cupIcon.y, cupIcon.w, cupIcon.h)

  // Collection name
  ctx.fillStyle = "#0DB4FB"
  ctx.font = "400 35px Whitney"
  const collectionName = {
    w: widthOf(ctx, name),
    h: heightOf(ctx, name),
    x: container.x.from,
    y: moduleTitle.y + moduleTitle.mb,
    mb: 80,
  }
  ctx.fillText(name, collectionName.x, collectionName.y)

  // Draw thumbnail
  const avatarConf: RoundedRectangleStats = {
    x: 690,
    y: collectionName.y - 25,
    w: 250,
    h: 250,
    radius: 20,
  }
  if (collection_image) {
    ctx.save()
    renderRoundedImage(ctx, avatarConf)
    ctx.strokeStyle = "#2465D3"
    ctx.stroke()
    ctx.clip()
    const collectionImage = await loadImage(collection_image)
    ctx.drawImage(
      collectionImage,
      avatarConf.x,
      avatarConf.y,
      avatarConf.w,
      avatarConf.h
    )
    ctx.restore()
  }

  /* DRAW COLUMN 1 */
  // Chain title
  ctx.font = "bold 30px Whitney"
  ctx.fillStyle = "white"
  const chainTitleStr = "Chain"
  const chainTitle = {
    x: container.x.from,
    y: collectionName.y + collectionName.mb,
    mb: 45,
  }
  ctx.fillText(chainTitleStr, chainTitle.x, chainTitle.y)

  // Chain value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const chainStr = `${chain}`
  const chainValue = {
    x: chainTitle.x,
    y: chainTitle.y + chainTitle.mb,
    mb: 60,
  }
  ctx.fillText(chainStr, chainValue.x, chainValue.y)
  ctx.restore()

  // Owner title
  ctx.font = "bold 30px Whitney"
  ctx.fillStyle = "white"
  const ownerTitleStr = "Owner"
  const ownerTitle = {
    x: container.x.from,
    y: chainValue.y + chainValue.mb,
    mb: 45,
  }
  ctx.fillText(ownerTitleStr, ownerTitle.x, ownerTitle.y)

  // Owner value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const ownerValueStr = `${owner}`
  const ownerValue = {
    x: ownerTitle.x,
    y: ownerTitle.y + ownerTitle.mb,
    mb: 60,
  }
  ctx.fillText(ownerValueStr, ownerValue.x, ownerValue.y)
  ctx.restore()

  // Floor Price title
  ctx.font = "bold 30px Whitney"
  ctx.fillStyle = "white"
  const floorPriceTitleStr = "Floor price"
  const floorPriceTitle = {
    x: container.x.from,
    y: ownerValue.y + ownerValue.mb,
    mb: 45,
  }
  ctx.fillText(floorPriceTitleStr, floorPriceTitle.x, floorPriceTitle.y)

  // Floor Price value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const floorPriceStr = `$${(floor_price * 1000).toLocaleString()}`
  const floorPrice = {
    x: floorPriceTitle.x,
    y: floorPriceTitle.y + floorPriceTitle.mb,
    mb: 60,
  }
  ctx.fillText(floorPriceStr, floorPrice.x, floorPrice.y)
  ctx.restore()

  // Change 1h title
  ctx.font = "bold 30px Whitney"
  ctx.fillStyle = "white"
  const change1hTitleStr = "Change (1h)"
  const change1hTitle = {
    x: container.x.from,
    y: floorPrice.y + floorPrice.mb,
    mb: 45,
  }
  ctx.fillText(change1hTitleStr, change1hTitle.x, change1hTitle.y)

  // Change 1h value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = change1h > 0 ? "#93E0E3" : "#F0918D"
  const change1hStr = change1h > 0 ? `+${change1h}%` : `${change1h}%`
  const change1hValue = {
    x: change1hTitle.x,
    y: change1hTitle.y + change1hTitle.mb,
    mb: 60,
  }
  ctx.fillText(change1hStr, change1hValue.x, change1hValue.y)
  ctx.restore()

  /* DRAW COLUMN 2 */
  const X_START = 330
  // Item title
  const itemTitleStr = "Item"
  const itemTitle = {
    x: X_START,
    y: collectionName.y + collectionName.mb,
    mb: 45,
  }
  ctx.fillText(itemTitleStr, itemTitle.x, itemTitle.y)

  // Item value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const itemStr = `${item}`
  const itemValue = {
    x: itemTitle.x,
    y: itemTitle.y + itemTitle.mb,
    mb: 60,
  }
  ctx.fillText(itemStr, itemValue.x, itemValue.y)
  ctx.restore()

  // Volume title
  const volumeTitleStr = "Volume"
  const volumeTitle = {
    x: X_START,
    y: itemValue.y + itemValue.mb,
    mb: 45,
  }
  ctx.fillText(volumeTitleStr, volumeTitle.x, volumeTitle.y)

  // Volume value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const volumeStr = `${volume}`
  const volumeValue = {
    x: volumeTitle.x,
    y: volumeTitle.y + volumeTitle.mb,
    mb: 60,
  }
  ctx.fillText(volumeStr, volumeValue.x, volumeValue.y)
  ctx.restore()

  // Last Price title
  const lastPriceTitleStr = "Last price"
  const lastPriceTitle = {
    x: X_START,
    y: volumeValue.y + volumeValue.mb,
    mb: 45,
  }
  ctx.fillText(lastPriceTitleStr, lastPriceTitle.x, lastPriceTitle.y)

  // Last Price value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const lastPriceStr = `$${(last_price * 1000).toLocaleString()}`
  const lastPrice = {
    x: lastPriceTitle.x,
    y: lastPriceTitle.y + lastPriceTitle.mb,
    mb: 60,
  }
  ctx.fillText(lastPriceStr, lastPrice.x, lastPrice.y)
  ctx.restore()

  // Change 24h title
  ctx.font = "bold 30px Whitney"
  ctx.fillStyle = "white"
  const change24hTitleStr = "Change (24h)"
  const change24hTitle = {
    x: X_START,
    y: lastPrice.y + lastPrice.mb,
    mb: 45,
  }
  ctx.fillText(change24hTitleStr, change24hTitle.x, change24hTitle.y)

  // Change 24h value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = change24h > 0 ? "#93E0E3" : "#F0918D"
  const change24hStr = change24h > 0 ? `+${change24h}%` : `${change24h}%`
  const change24hValue = {
    x: change24hTitle.x,
    y: change24hTitle.y + change24hTitle.mb,
    mb: 60,
  }
  ctx.fillText(change24hStr, change24hValue.x, change24hValue.y)
  ctx.restore()

  // Change 7d title
  ctx.font = "bold 30px Whitney"
  ctx.fillStyle = "white"
  const change7dTitleStr = "Change (1d)"
  const change7dTitle = {
    x: 690,
    y: lastPrice.y + lastPrice.mb,
    mb: 45,
  }
  ctx.fillText(change7dTitleStr, change7dTitle.x, change7dTitle.y)

  // Change 7d value
  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = change7d > 0 ? "#93E0E3" : "#F0918D"
  const change7dStr = change7d > 0 ? `+${change7d}%` : `${change7d}%`
  const change7dValue = {
    x: change7dTitle.x,
    y: change7dTitle.y + change7dTitle.mb,
    mb: 60,
  }
  ctx.fillText(change7dStr, change7dValue.x, change7dValue.y)
  ctx.restore()

  const { times, prices } = data.tickers
  const chartBuff = await renderChartImage({
    chartLabel: "Price (USD)",
    labels: times,
    data: prices,
  })
  const chartImg = await loadImage(chartBuff)
  ctx.drawImage(
    chartImg,
    container.x.from,
    change7dValue.y + change7dValue.mb,
    980,
    260
  )

  return new MessageAttachment(canvas.toBuffer(), "ticker.png")
}

const command: Command = {
  id: "nft_ticker",
  command: "ticker",
  brief: "Check an NFT collection ticker",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const symbol = args[2]
    const res = await community.getNFTCollectionTickers(symbol)
    const data = {
      tickers: res.tickers,
      floor_price: res.floor_price,
      name: res.name,
      contract_address: res.contract_address,
      chain: res.chain,
      platforms: res.platforms,
      last_price: 0.0001,
      change1h: -0.64,
      change24h: -0.01,
      change7d: 2.71,
      owner: "4.15K",
      volume: "955.82 ETH",
      item: "6.97K",
      collection_image:
        "https://lh3.googleusercontent.com/lP0ywqisBVutTJZ_Uuhe7JFqvticZjRypfQh4CpXwcljxM_JlO0jT-4-LRil18KPHidXm9slLkTDta1XRC5HAg2IVhwCVohdNF3odQ",
    }

    const embed = composeEmbedMessage(msg, {
      image: "attachment://ticker.png",
      withoutFooter: true,
    })

    return {
      messageOptions: {
        embeds: [embed],
        files: [await renderTicker(msg, data)],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft ticker <collection_symbol>`,
          examples: `${PREFIX}nft ticker neko`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
