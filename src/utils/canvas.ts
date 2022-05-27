import { CanvasRenderingContext2D, loadImage } from "canvas"
import { GuildMember, User } from "discord.js"
import { CircleleStats, RectangleStats } from "types/canvas"

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
  hexColor: string
) {
  const { radius, x, y } = stats
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 2
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
  drawRectangle(ctx, pgBarContainer, "#4a4a4a")
  // pg bar overlay
  if (progress === 0) return
  const overlay = pgBarContainer
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
