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
  ctx.arc(stats.x.to - radius, stats.y.from + radius, radius, 1.5 * Math.PI, 0) // top-right corner
  ctx.lineTo(stats.x.to, stats.y.to - radius) // right edge
  ctx.arc(stats.x.to - radius, stats.y.to - radius, radius, 0, 0.5 * Math.PI) // bottom-right corner
  ctx.lineTo(stats.x.from + radius, stats.y.to) // bottom edge
  ctx.arc(
    stats.x.from + radius,
    stats.y.to - radius,
    radius,
    0.5 * Math.PI,
    Math.PI
  ) // bottom-left corner
  ctx.lineTo(stats.x.from, stats.y.from + radius) // left edge
  ctx.arc(
    stats.x.from + radius,
    stats.y.from + radius,
    radius,
    Math.PI,
    1.5 * Math.PI
  ) // top-left corner
  ctx.fill()
  ctx.closePath()
}
