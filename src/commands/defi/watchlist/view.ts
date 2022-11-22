import { Command } from "types/common"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import {
  authorFilter,
  emojis,
  getEmojiURL,
  thumbnails,
  tokenEmojis,
} from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import defi from "adapters/defi"
import { createCanvas, loadImage, registerFont } from "canvas"
import { RectangleStats } from "types/canvas"
import {
  drawCircleImage,
  drawRectangle,
  heightOf,
  loadAndCacheImage,
  renderChartImage,
  widthOf,
} from "utils/canvas"
import CacheManager from "utils/CacheManager"
import { APIError } from "errors"
import { MessageComponentTypes } from "discord.js/typings/enums"
import community from "adapters/community"
import { wrapError } from "utils/wrapError"

let fontRegistered = false

async function renderWatchlist(data: any[]) {
  if (!fontRegistered) {
    registerFont("src/assets/fonts/inter/Inter-Regular.ttf", {
      family: "Inter",
    })
    registerFont("src/assets/fonts/inter/Inter-Bold.ttf", {
      family: "Inter",
      weight: "bold",
    })
    fontRegistered = true
  }
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 900,
    },
    y: {
      from: 0,
      to: 780,
    },
    w: 0,
    h: 0,
    pt: 50,
    pl: 10,
    radius: 0,
    bgColor: "rgba(0, 0, 0, 0)",
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  drawRectangle(ctx, container, container.bgColor)

  const ascColor = "#56c9ac"
  const descColor = "#ed5565"
  const itemContainer: RectangleStats = {
    x: {
      from: 0,
      to: 0,
    },
    y: {
      from: 0,
      to: 120,
    },
    mt: 10,
    w: 0,
    h: 120,
    pt: 20,
    pl: 15,
    radius: 7,
    bgColor: "#202020",
  }
  for (const [idx, item] of Object.entries(data)) {
    const leftCol = +idx % 2 === 0
    itemContainer.x = {
      from: leftCol ? 0 : 455,
      to: leftCol ? 445 : 900,
    }
    drawRectangle(ctx, itemContainer, itemContainer.bgColor)
    const {
      symbol,
      current_price,
      sparkline_in_7d,
      price_change_percentage_7d_in_currency,
      image,
      is_pair,
    } = item
    let imageUrl = image
    // image
    const radius = 20
    const imageX = itemContainer.x.from + (itemContainer.pl ?? 0)
    const imageY = itemContainer.y.from + (itemContainer.pt ?? 0)
    // if no imageUrl then find and use discord emoji URL
    if (!imageUrl && is_pair) {
      const [base, target] = symbol
        .split("/")
        .map((s: string) => emojis[s.toUpperCase()])
      imageUrl =
        base && target
          ? [getEmojiURL(base), getEmojiURL(target)].join("||")
          : ""
    }
    if (imageUrl) {
      const imageStats = {
        radius,
        outlineColor: "white",
        outlineWidth: 5,
      }
      if (!is_pair) {
        const image = await loadAndCacheImage(imageUrl, radius * 2, radius * 2)
        drawCircleImage({
          ctx,
          image,
          stats: {
            x: imageX + radius,
            y: imageY + radius,
            ...imageStats,
          },
        })
      } else {
        const imageUrls = imageUrl.split("||")
        const baseImage = await loadAndCacheImage(
          imageUrls[0],
          radius * 2,
          radius * 2
        )
        drawCircleImage({
          ctx,
          stats: {
            x: imageX + radius,
            y: imageY + radius,
            ...imageStats,
          },
          image: baseImage,
        })
        const targetImage = await loadAndCacheImage(
          imageUrls[1],
          radius * 2,
          radius * 2
        )
        drawCircleImage({
          ctx,
          stats: {
            x: imageX + radius * 2.5,
            y: imageY + radius,
            ...imageStats,
          },
          image: targetImage,
        })
      }
    }

    // symbol
    ctx.font = "bold 29px Inter"
    ctx.fillStyle = "white"
    const symbolText = symbol.toUpperCase()
    const symbolH = heightOf(ctx, symbolText)
    const symbolX = imageX + radius * (is_pair ? 3.5 : 2) + 10
    const symbolY = imageY + radius + symbolH / 2
    ctx.fillText(symbolText, symbolX, symbolY)

    // price
    ctx.font = "bold 30px Inter"
    ctx.fillStyle = "white"
    const currentPrice = `${
      is_pair ? "" : "$"
    }${current_price.toLocaleString()}`
    const priceW = widthOf(ctx, currentPrice)
    const priceH = heightOf(ctx, currentPrice)
    const priceX = imageX
    const priceY = imageY + priceH + radius * 2 + 10
    ctx.fillText(currentPrice, priceX, priceY)

    // 7d change percentage
    ctx.font = "25px Inter"
    ctx.fillStyle =
      price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor
    const change = `${
      price_change_percentage_7d_in_currency >= 0 ? "+" : ""
    }${price_change_percentage_7d_in_currency.toFixed(2)}%`
    const changeX = priceX + priceW + 10
    const changeY = priceY
    ctx.fillText(change, changeX, changeY)

    // 7d chart
    const { price } = sparkline_in_7d
    const labels = price.map((p: number) => `${p}`)
    const buffer = await renderChartImage({
      labels,
      data: price,
      lineOnly: true,
      colorConfig: {
        borderColor:
          price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor,
        backgroundColor: "#fff",
      },
    })
    const chart = await loadImage(buffer)
    const chartW = 150
    const chartH = 50
    const chartX = itemContainer.x.to - chartW - 15
    const chartY = itemContainer.y.from + (itemContainer.pt ?? 0) + chartH / 2
    ctx.drawImage(chart, chartX, chartY, chartW, chartH)

    // next row
    if (!leftCol) {
      itemContainer.y.from += itemContainer.h + (itemContainer.mt ?? 0)
      itemContainer.y.to = itemContainer.y.from + itemContainer.h
    }
  }

  return new MessageAttachment(canvas.toBuffer(), "watchlist.png")
}

async function renderNFTWatchlist(data: any[]) {
  if (!fontRegistered) {
    registerFont("src/assets/fonts/inter/Inter-Regular.ttf", {
      family: "Inter",
    })
    registerFont("src/assets/fonts/inter/Inter-Bold.ttf", {
      family: "Inter",
      weight: "bold",
    })
    fontRegistered = true
  }
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 900,
    },
    y: {
      from: 0,
      to: 780,
    },
    w: 0,
    h: 0,
    pt: 50,
    pl: 10,
    radius: 0,
    bgColor: "rgba(0, 0, 0, 0)",
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  drawRectangle(ctx, container, container.bgColor)

  const ascColor = "#56c9ac"
  const descColor = "#ed5565"
  const itemContainer: RectangleStats = {
    x: {
      from: 0,
      to: 0,
    },
    y: {
      from: 0,
      to: 120,
    },
    mt: 10,
    w: 0,
    h: 120,
    pt: 20,
    pl: 15,
    radius: 7,
    bgColor: "#202020",
  }
  for (const [idx, item] of Object.entries(data)) {
    const leftCol = +idx % 2 === 0
    itemContainer.x = {
      from: leftCol ? 0 : 455,
      to: leftCol ? 445 : 900,
    }
    drawRectangle(ctx, itemContainer, itemContainer.bgColor)
    const {
      symbol,
      floor_price,
      sparkline_in_7d,
      price_change_percentage_24h,
      price_change_percentage_7d_in_currency,
      token,
    } = item
    // image
    const radius = 20
    const image = await loadAndCacheImage(item.image, radius * 2, radius * 2)
    const imageX = itemContainer.x.from + (itemContainer.pl ?? 0)
    const imageY = itemContainer.y.from + (itemContainer.pt ?? 0)
    ctx.drawImage(image, imageX, imageY, radius * 2, radius * 2)

    // symbol
    ctx.font = "bold 29px Inter"
    ctx.fillStyle = "white"
    const symbolText = symbol.toUpperCase()
    const symbolH = heightOf(ctx, symbolText)
    const symbolX = imageX + radius * 2 + 10
    const symbolY = imageY + radius + symbolH / 2
    ctx.fillText(symbolText, symbolX, symbolY)

    // Token logo
    const fallbackTokenLogoURL = "https://i.imgur.com/2MdXSOd.png"
    const tokenEmojiId = tokenEmojis[token?.symbol ?? ""] ?? ""
    const tokenLogoURL = getEmojiURL(tokenEmojiId)
    const tokenH = 25
    const tokenW = 25
    const tokenLogo = await loadAndCacheImage(
      tokenEmojiId ? tokenLogoURL : fallbackTokenLogoURL,
      tokenW,
      tokenH
    )
    const tokenX = imageX
    const tokenY = imageY + tokenH + radius + 20
    ctx.drawImage(tokenLogo, tokenX, tokenY, tokenW, tokenH)

    // price
    ctx.font = "bold 30px Inter"
    ctx.fillStyle = "white"
    const currentPrice = `${floor_price}`
    const priceW = widthOf(ctx, currentPrice)
    const priceH = heightOf(ctx, currentPrice)
    const priceX = tokenX + tokenW + 5
    const priceY = tokenY + priceH
    ctx.fillText(currentPrice, priceX, priceY)

    // 24h change
    ctx.font = "25px Inter"
    ctx.fillStyle = price_change_percentage_24h >= 0 ? ascColor : descColor
    const change = `${
      price_change_percentage_24h >= 0 ? "+" : ""
    }${price_change_percentage_24h.toFixed(2)}%`
    const changeX = priceX + priceW + 10
    const changeY = priceY
    ctx.fillText(change, changeX, changeY)

    // 7d chart
    const { price } = sparkline_in_7d
    const labels = price.map((p: number) => `${p}`)
    const buffer = await renderChartImage({
      labels,
      data: price,
      lineOnly: true,
      colorConfig: {
        borderColor:
          price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor,
        backgroundColor: "#fff",
      },
    })
    const chart = await loadImage(buffer)
    const chartW = 150
    const chartH = 50
    const chartX = itemContainer.x.to - chartW - 15
    const chartY = itemContainer.y.from + (itemContainer.pt ?? 0) + chartH / 2
    ctx.drawImage(chart, chartX, chartY, chartW, chartH)

    // next row
    if (!leftCol) {
      itemContainer.y.from += itemContainer.h + (itemContainer.mt ?? 0)
      itemContainer.y.to = itemContainer.y.from + itemContainer.h
    }
  }

  return new MessageAttachment(canvas.toBuffer(), "watchlist.png")
}

function buildSwitchViewActionRow(currentView: string) {
  const tokenButton = new MessageButton({
    label: "Token",
    emoji: emojis.ASSET,
    customId: `watchlist-switch-view-button/token}`,
    style: "SECONDARY",
    disabled: currentView === "token",
  })
  const nftButton = new MessageButton({
    label: "NFT",
    emoji: emojis.NFT,
    customId: `watchlist-switch-view-button/nft`,
    style: "SECONDARY",
    disabled: currentView === "nft",
  })
  const row = new MessageActionRow()
  row.addComponents([tokenButton, nftButton])
  return row
}

function collectButton(msg: Message, originMsg: Message) {
  return msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(originMsg.author.id),
    })
    .on("collect", (i) => {
      wrapError(originMsg, async () => {
        await switchView(i, msg, originMsg)
      })
    })
    .on("end", () => {
      msg.edit({ components: [] }).catch(() => null)
    })
}

async function switchView(
  i: ButtonInteraction,
  msg: Message,
  originMsg: Message
) {
  let embeds: MessageEmbed[]
  let components: MessageActionRow[] | undefined
  let files: MessageAttachment[] | undefined
  const currentView = i.customId.split("/").pop() ?? "token"
  switch (currentView) {
    case "nft":
      ;({ embeds, files, components } = await composeNFTWatchlist(originMsg))
      break
    case "token":
    default:
      ;({ embeds, files, components } = await composeTokenWatchlist(originMsg))
      break
  }
  await i
    .editReply({
      embeds,
      files,
      components: components,
    })
    .catch(() => null)
}

async function composeTokenWatchlist(msg: Message, authorId?: string) {
  const userId = msg.author.id
  const { data, ok, log, curl } = await CacheManager.get({
    pool: "watchlist",
    key: `watchlist-${userId}`,
    call: () => defi.getUserWatchlist({ userId, size: 12 }),
    ...(authorId && {
      callIfCached: () =>
        community.updateQuestProgress({
          userId: authorId,
          action: "watchlist",
        }),
    }),
  })
  if (!ok) throw new APIError({ message: msg, curl, description: log })
  const embed = composeEmbedMessage(msg, {
    author: [
      `${msg.author.username}'s watchlist`,
      msg.author.displayAvatarURL({ format: "png" }),
    ],
  })
  if (!data?.length) {
    embed.setDescription(
      `No items in your watchlist.Run \`${PREFIX}wl add\` to add one.`
    )
    return {
      embeds: [embed],
      files: [],
      components: [buildSwitchViewActionRow("token")],
    }
  }
  if (data[0].is_default) {
    embed.setDescription(
      `No items in your watchlist. Run \`${PREFIX}wl add\` to add one.\nBelow is the **default watchlist**`
    )
  }
  embed.setImage("attachment://watchlist.png")
  return {
    embeds: [embed],
    files: [await renderWatchlist(<any[]>data)],
    components: [buildSwitchViewActionRow("token")],
  }
}

async function composeNFTWatchlist(msg: Message) {
  const userId = msg.author.id
  const { data, ok, log, curl } = await CacheManager.get({
    pool: "watchlist",
    key: `watchlist-nft-${userId}`,
    call: () => defi.getUserNFTWatchlist({ userId, size: 12 }),
  })
  if (!ok) throw new APIError({ message: msg, curl, description: log })
  const embed = composeEmbedMessage(msg, {
    author: [
      `${msg.author.username}'s watchlist`,
      msg.author.displayAvatarURL({ format: "png" }),
    ],
  })
  if (!data?.length) {
    embed.setDescription(
      `No items in your watchlist.\n Please use \`${PREFIX}watchlist add-nft\` to add one.`
    )
    return {
      embeds: [embed],
      files: [],
      components: [buildSwitchViewActionRow("nft")],
    }
  }
  embed.setImage("attachment://watchlist.png")
  return {
    embeds: [embed],
    files: [await renderNFTWatchlist(<any[]>data)],
    components: [buildSwitchViewActionRow("nft")],
  }
}

const command: Command = {
  id: "watchlist_view",
  command: "view",
  brief: "View your watchlist",
  category: "Defi",
  run: async (msg) => {
    const { embeds, files, components } = await composeTokenWatchlist(
      msg,
      msg.author.id
    )
    const replyMsg = await msg.reply({
      embeds,
      components,
      files,
    })
    collectButton(replyMsg, msg)
    return null
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Show list of your favorite tokens",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}watchlist view [page]`,
        examples: `${PREFIX}wl view`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
