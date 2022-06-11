import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas"
import { GuildMember, User } from "discord.js"
import { CircleleStats, RectangleStats } from "types/canvas"
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

export async function drawAvatar(
  ctx: CanvasRenderingContext2D,
  avatar: CircleleStats,
  user: User
) {
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.arc(avatar.x, avatar.y, avatar.radius, 0, Math.PI * 2)
  if (avatar.outlineColor) {
    ctx.strokeStyle = avatar.outlineColor
    ctx.stroke()
  }
  ctx.closePath()
  ctx.clip()

  const avatarURL = user.displayAvatarURL({ format: "jpeg" })
  if (avatarURL) {
    const userAvatar = await loadImage(avatarURL)
    ctx.drawImage(
      userAvatar,
      avatar.x - avatar.radius,
      avatar.y - avatar.radius,
      avatar.radius * 2,
      avatar.radius * 2
    )
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
