import {
  CanvasGradient,
  CanvasRenderingContext2D,
  createCanvas,
  Image,
  loadImage,
} from "canvas"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import { GuildMember, MessageAttachment } from "discord.js"
import { CircleleStats, RectangleStats } from "types/canvas"
import { NFTCollection } from "types/community"
import { emojis, getEmojiURL, msgColors, thumbnails } from "./common"
import { SPACE } from "./constants"

export function widthOf(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width
}

export function heightOf(ctx: CanvasRenderingContext2D, text: string): number {
  return (
    ctx.measureText(text).actualBoundingBoxAscent +
    ctx.measureText(text).actualBoundingBoxDescent
  )
}

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  stats: RectangleStats,
  hexColor: string,
  borderColor?: string
) {
  const { radius, x, y } = stats
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 6
  ctx.fillStyle = hexColor
  ctx.moveTo(x.from + radius, y.from)
  ctx.lineTo(x.to - radius, y.from) // top edge
  ctx.arc(x.to - radius, y.from + radius, radius, 1.5 * Math.PI, 0) // top-right corner
  ctx.lineTo(x.to, y.to - radius) // right edge
  ctx.arc(x.to - radius, y.to - radius, radius, 0, 0.5 * Math.PI) // bottom-right corner
  ctx.lineTo(x.from + radius, y.to) // bottom edge
  ctx.arc(x.from + radius, y.to - radius, radius, 0.5 * Math.PI, Math.PI) // bottom-left corner
  ctx.lineTo(x.from, y.from + radius) // left edge
  ctx.arc(x.from + radius, y.from + radius, radius, Math.PI, 1.5 * Math.PI) // top-left corner
  ctx.fill()
  if (borderColor) {
    ctx.strokeStyle = borderColor
    ctx.stroke()
  }
  ctx.closePath()
  // --------------
  ctx.restore()
}

export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  pgBarContainer: RectangleStats,
  progress: number
) {
  ctx.save()
  // --------------
  // pg bar container
  drawRectangle(ctx, pgBarContainer, "#231E2B", pgBarContainer.overlayColor)
  // pg bar overlay
  if (progress === 0) return
  const overlay = JSON.parse(JSON.stringify(pgBarContainer)) // deep copy
  overlay.x.to = Math.max(
    overlay.x.from + overlay.radius * 2,
    overlay.x.from + overlay.w * progress
  )
  drawRectangle(ctx, overlay, pgBarContainer.overlayColor)
  // --------------
  ctx.restore()
}

// export async function drawAvatar(
//   ctx: CanvasRenderingContext2D,
//   avatar: CircleleStats,
//   user: User
// ) {
//   ctx.save()
//   // --------------
//   ctx.beginPath()
//   ctx.lineWidth = 10
//   ctx.arc(avatar.x, avatar.y, avatar.radius, 0, Math.PI * 2)
//   if (avatar.outlineColor) {
//     ctx.strokeStyle = avatar.outlineColor
//     ctx.stroke()
//   }
//   ctx.closePath()
//   ctx.clip()

//   const avatarURL = user.displayAvatarURL({ format: "jpeg" })
//   if (avatarURL) {
//     const userAvatar = await loadImage(avatarURL)
//     ctx.drawImage(
//       userAvatar,
//       avatar.x - avatar.radius,
//       avatar.y - avatar.radius,
//       avatar.radius * 2,
//       avatar.radius * 2
//     )
//   }
//   // --------------
//   ctx.restore()
// }

export async function drawCircleImage({
  ctx,
  stats,
  imageURL,
  image,
}: {
  ctx: CanvasRenderingContext2D
  stats: CircleleStats
  imageURL?: string
  image?: Image
}) {
  if (!image && !imageURL) return
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.arc(stats.x, stats.y, stats.radius, 0, Math.PI * 2)
  if (stats.outlineColor) {
    ctx.strokeStyle = stats.outlineColor
    ctx.stroke()
  }
  ctx.closePath()
  ctx.clip()

  if (!image && imageURL) {
    image = await loadImage(imageURL)
  }
  ctx.drawImage(
    image,
    stats.x - stats.radius,
    stats.y - stats.radius,
    stats.radius * 2,
    stats.radius * 2
  )
  // --------------
  ctx.restore()
}

export function loadImages(urls: string[]) {
  return urls.reduce(async (prev: { [key: string]: any }, cur) => {
    const acc = await prev
    return {
      ...acc,
      ...(!acc[cur] ? { [cur]: await loadImage(cur) } : {}),
    }
  }, {})
}

export async function drawRectangleAvatar(
  ctx: CanvasRenderingContext2D,
  avatar: RectangleStats,
  avatarURL: string
) {
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.moveTo(avatar.x.from + avatar.radius, avatar.y.from)
  ctx.arcTo(
    avatar.x.to,
    avatar.y.from,
    avatar.x.to,
    avatar.y.from + avatar.radius,
    avatar.radius
  )

  ctx.arcTo(
    avatar.x.to,
    avatar.y.to,
    avatar.x.to - avatar.radius,
    avatar.y.to,
    avatar.radius
  )

  ctx.arcTo(
    avatar.x.from,
    avatar.y.to,
    avatar.x.from,
    avatar.y.to - avatar.radius,
    avatar.radius
  )

  ctx.arcTo(
    avatar.x.from,
    avatar.y.from,
    avatar.x.from + avatar.radius,
    avatar.y.from,
    avatar.radius
  )
  ctx.closePath()
  ctx.clip()

  if (avatarURL) {
    const userAvatar = await loadImage(avatarURL)
    ctx.drawImage(userAvatar, avatar.x.from, avatar.y.from, avatar.w, avatar.h)
  }
  // --------------
  ctx.restore()
}

export function getHighestRoleColor(member: GuildMember) {
  const { hexColor } = member.roles.highest
  return hexColor === "#000000" ? "white" : hexColor
}

export function fillWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  const words = text.split(/ +/g)
  const lineHeight = heightOf(ctx, text) + 7
  let lineText = ""
  for (let i = 0; i < words.length; i++) {
    const newLine = `${lineText}${words[i]}${SPACE}`
    if (widthOf(ctx, newLine) > maxWidth) {
      ctx.fillText(lineText, x, y)
      lineText = `${words[i]}${SPACE}`
      y += lineHeight
      continue
    }
    lineText = newLine
  }
  ctx.fillText(lineText, x, y)
  return y
}

export function calculateWrapperTextHeight(
  text: string,
  font: string,
  maxWidth: number
) {
  const canvas = createCanvas(0, 0)
  const ctx = canvas.getContext("2d")
  ctx.font = font
  const words = text.split(/ +/g)
  const lineHeight = heightOf(ctx, text) + 7
  let lineText = ""
  let y = 0
  for (let i = 0; i < words.length; i++) {
    const newLine = `${lineText}${words[i]}${SPACE}`
    if (widthOf(ctx, newLine) > maxWidth) {
      lineText = `${words[i]}${SPACE}`
      y += lineHeight
      continue
    }
    lineText = newLine
  }
  return y
}

export function drawDivider(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  y: number
) {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = "#5C5A5A"
  ctx.moveTo(fromX, y)
  ctx.lineTo(toX, y)
  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}

export function getGradientColor(
  fromColor: string,
  toColor: string
): CanvasGradient {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const backgroundColor = ctx.createLinearGradient(0, 0, 0, 400)
  backgroundColor.addColorStop(0, fromColor)
  backgroundColor.addColorStop(1, toColor)
  return backgroundColor
}

export async function renderChartImage({
  chartLabel,
  labels,
  data,
  colorConfig,
}: {
  chartLabel: string
  labels: string[]
  data: number[]
  colorConfig?: {
    borderColor: string
    backgroundColor: string | CanvasGradient
  }
}) {
  if (!colorConfig) {
    colorConfig = {
      borderColor: "#E0615D",
      backgroundColor: getGradientColor(
        msgColors.PRIMARY.toString(),
        "rgba(184, 114, 110,0.5)"
      ),
    }
  }
  const chartCanvas = new ChartJSNodeCanvas({ width: 970, height: 650 })
  const axisConfig = {
    ticks: {
      font: {
        size: 20,
      },
    },
    grid: {
      borderColor: colorConfig.borderColor,
    },
  }
  return chartCanvas.renderToBuffer({
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: chartLabel,
          data,
          borderWidth: 6,
          pointRadius: 0,
          fill: true,
          ...colorConfig,
          tension: 0.5,
        },
      ],
    },
    options: {
      scales: {
        y: axisConfig,
        x: axisConfig,
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 24,
            },
          },
        },
      },
    },
  })
}

export function handleTextOverflow(
  c: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  let width = c.measureText(text).width
  const ellipsis = "…"
  const ellipsisWidth = c.measureText(ellipsis).width
  if (width <= maxWidth || width <= ellipsisWidth) {
    return text
  } else {
    let len = text.length
    while (width >= maxWidth - ellipsisWidth && len-- > 0) {
      text = text.substring(0, len)
      width = c.measureText(text).width
    }
    return text + ellipsis
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

export async function drawLeaderboard(options: {
  rows: { username: string; discriminator: string; rightValue: string }[]
  leftHeader: string
  rightHeader: string
}) {
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
    pt: 50,
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

  // divider
  drawDivider(
    ctx,
    container.x.from + container.pl,
    container.x.to - container.pl,
    0
  )

  // left title
  ctx.font = "bold 33px Manrope"
  ctx.fillStyle = "white"
  const userTitleStr = options.leftHeader
  const userTitle = {
    x: container.x.from + container.pl,
    y: container.pt,
    mb: 20,
  }
  ctx.fillText(userTitleStr, userTitle.x, userTitle.y)

  // right title
  const rightTitleStr = options.rightHeader
  const rightTitle = {
    x: 650,
    y: userTitle.y,
  }
  ctx.fillText(rightTitleStr, rightTitle.x, rightTitle.y)

  // users
  const badgeIcon = {
    w: 30,
    h: 40,
    mr: 30,
  }
  const line = {
    x: userTitle.x,
    y: userTitle.y + userTitle.mb,
    h: 40,
    mb: 20,
  }
  const username = {
    x: line.x + badgeIcon.w + badgeIcon.mr,
    y: line.y,
    mr: 10,
  }
  ctx.font = "27px Manrope"
  for (const [index, item] of options.rows.entries()) {
    username.y +=
      heightOf(ctx, item.username) +
      (badgeIcon.h - heightOf(ctx, item.username)) / 2
    switch (index + 1) {
      case 1:
      case 2:
      case 3: {
        // icon
        const badgeImg = await loadImage(
          getEmojiURL(emojis[`BADGE${index + 1}`])
        )
        ctx.drawImage(badgeImg, line.x, line.y, badgeIcon.w, badgeIcon.h)
        break
      }
      default: {
        const rankStr = `${index + 1 < 10 ? `0${index + 1}.` : `${index + 1}.`}`
        ctx.fillStyle = "#898A8C"
        ctx.fillText(rankStr, line.x, username.y)
        break
      }
    }
    // username
    ctx.font = "bold 27px Manrope"
    ctx.fillStyle = "white"
    ctx.fillText(item.username, username.x, username.y)

    // discriminator
    const discriminator = {
      x: username.x + widthOf(ctx, item.username) + username.mr,
      y: username.y,
      mr: 20,
    }
    ctx.font = "27px Manrope"
    ctx.fillStyle = "#888888"
    ctx.fillText(`#${item.discriminator}`, discriminator.x, discriminator.y)

    // right value
    const rightStr = `${item.rightValue} `
    ctx.font = "bold 27px Manrope"
    ctx.fillStyle = "#BFBFBF"
    const rightValue = {
      x: rightTitle.x,
      y: discriminator.y,
      w: widthOf(ctx, rightStr),
    }
    ctx.fillText(rightStr, rightValue.x, rightValue.y)
    line.y += line.h + line.mb
    username.y = line.y
  }

  return new MessageAttachment(canvas.toBuffer(), "leaderboard.png")
}
