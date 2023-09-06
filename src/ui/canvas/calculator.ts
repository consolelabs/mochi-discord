import { CanvasRenderingContext2D, createCanvas } from "canvas"
import { SPACE } from "utils/constants"

export function widthOf(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width
}

export function heightOf(ctx: CanvasRenderingContext2D, text: string): number {
  return (
    ctx.measureText(text).actualBoundingBoxAscent +
    ctx.measureText(text).actualBoundingBoxDescent
  )
}

export function calculateWrapperTextHeight(
  text: string,
  font: string,
  maxWidth: number,
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
