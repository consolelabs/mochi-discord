import { Image, loadImage, CanvasRenderingContext2D } from "canvas"
import { CircleleStats, RectangleStats } from "types/canvas"

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  stats: RectangleStats,
  hexColor?: string,
  borderColor?: string
) {
  const { radius, x, y } = stats
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 6
  if (hexColor) {
    ctx.fillStyle = hexColor
  }
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
    ctx.lineWidth = 1
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
  image?: Image | null
}) {
  if (!image && !imageURL) return
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = stats.outlineWidth ?? 10
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
  if (!image) return
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
  return urls.reduce(async (acc: { [key: string]: any }, cur) => {
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

export function drawDivider(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  y: number,
  color?: string
) {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = color ?? "#918d8d"
  ctx.moveTo(fromX, y)
  ctx.lineTo(toX, y)
  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}

// export async function drawLeaderboard(options: {
//   rows: { username: string; discriminator: string; rightValue: string }[]
//   leftHeader: string
//   rightHeader: string
// }) {
//   const container: RectangleStats = {
//     x: {
//       from: 0,
//       to: 870,
//     },
//     y: {
//       from: 0,
//       to: 670,
//     },
//     w: 0,
//     h: 0,
//     pt: 50,
//     pl: 30,
//     radius: 30,
//     bgColor: "rgba(0, 0, 0, 0)", // transparent
//   }
//   container.w = container.x.to - container.x.from
//   container.h = container.y.to - container.y.from
//   const canvas = createCanvas(container.w, container.h)
//   const ctx = canvas.getContext("2d")
//   ctx.save()
//   drawRectangle(ctx, container, container.bgColor)
//   ctx.clip()

//   // divider
//   drawDivider(
//     ctx,
//     container.x.from + (container.pl ?? 0),
//     container.x.to - (container.pl ?? 0),
//     0
//   )

//   // left title
//   ctx.font = "bold 33px Manrope"
//   ctx.fillStyle = "white"
//   const userTitleStr = options.leftHeader
//   const userTitle = {
//     x: container.x.from + (container.pl ?? 0),
//     y: container.pt,
//     mb: 20,
//   }
//   ctx.fillText(userTitleStr, userTitle.x, userTitle.y ?? 0)

//   // right title
//   const rightTitleStr = options.rightHeader
//   const rightTitle = {
//     x:
//       container.w -
//       widthOf(ctx, rightTitleStr) -
//       (container.pr ?? container.pl ?? 0),
//     y: userTitle.y,
//   }
//   ctx.fillText(rightTitleStr, rightTitle.x, rightTitle.y ?? 0)

//   // users
//   const badgeIcon = {
//     w: 30,
//     h: 40,
//     mr: 30,
//   }
//   const line = {
//     x: userTitle.x,
//     y: (userTitle.y ?? 0) + userTitle.mb,
//     h: 40,
//     mb: 20,
//   }
//   const username = {
//     x: line.x + badgeIcon.w + badgeIcon.mr,
//     y: line.y,
//     mr: 10,
//   }
//   ctx.font = "27px Manrope"
//   for (const [index, item] of options.rows.entries()) {
//     username.y +=
//       heightOf(ctx, item.username) +
//       (badgeIcon.h - heightOf(ctx, item.username)) / 2
//     switch (index + 1) {
//       case 1:
//       case 2:
//       case 3: {
//         // icon
//         const badgeImg = await loadImage(
//           getEmojiURL(emojis[`BADGE${index + 1}`])
//         )
//         ctx.drawImage(badgeImg, line.x, line.y, badgeIcon.w, badgeIcon.h)
//         break
//       }
//       default: {
//         const rankStr = `${index + 1 < 10 ? `0${index + 1}.` : `${index + 1}.`}`
//         ctx.fillStyle = "#898A8C"
//         ctx.fillText(rankStr, line.x, username.y)
//         break
//       }
//     }
//     // username
//     ctx.font = "bold 27px Manrope"
//     ctx.fillStyle = "white"
//     ctx.fillText(item.username, username.x, username.y)

//     // discriminator
//     const discriminator = {
//       x: username.x + widthOf(ctx, item.username) + username.mr,
//       y: username.y,
//       mr: 20,
//     }
//     if (item.discriminator) {
//       ctx.font = "27px Manrope"
//       ctx.fillStyle = "#888888"
//       ctx.fillText(`#${item.discriminator}`, discriminator.x, discriminator.y)
//     }

//     // right value
//     const rightStr = `${item.rightValue} `
//     ctx.font = "bold 27px Manrope"
//     ctx.fillStyle = "#BFBFBF"
//     const rightValue = {
//       x:
//         container.w -
//         widthOf(ctx, rightStr) -
//         (container.pr ?? container.pl ?? 0),
//       y: discriminator.y,
//       w: widthOf(ctx, rightStr),
//     }
//     ctx.fillText(rightStr, rightValue.x, rightValue.y)
//     line.y += line.h + line.mb
//     username.y = line.y
//   }

//   return new MessageAttachment(canvas.toBuffer(), "leaderboard.png")
// }
