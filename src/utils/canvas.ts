import { CanvasRenderingContext2D } from "canvas"
import { RectangleStats } from "types/canvas"

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
  radius: number,
  hexColor: string
) {
  ctx.beginPath()
  ctx.lineWidth = 2
  ctx.fillStyle = hexColor
  ctx.moveTo(stats.x.from + radius, stats.y.from)
  ctx.lineTo(stats.x.to - radius, stats.y.from) // top edge
  ctx.quadraticCurveTo(
    stats.x.to - radius / 2,
    stats.y.from + radius / 2,
    stats.x.to,
    stats.y.from + radius
  ) // top-right angle
  ctx.lineTo(stats.x.to, stats.y.to - radius) // right edge
  ctx.quadraticCurveTo(
    stats.x.to - radius / 2,
    stats.y.to - radius / 2,
    stats.x.to - radius,
    stats.y.to
  ) // bottom-right angle
  ctx.lineTo(stats.x.from + radius, stats.y.to) // bottom edge
  ctx.quadraticCurveTo(
    stats.x.from + radius / 2,
    stats.y.to - radius / 2,
    stats.x.from,
    stats.y.to - radius
  ) // bottom-left angle
  ctx.lineTo(stats.x.from, stats.y.from + radius) // left edge
  ctx.fill()
  ctx.closePath()
}
