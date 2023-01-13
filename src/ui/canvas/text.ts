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
