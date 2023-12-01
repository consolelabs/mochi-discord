import { CanvasRenderingContext2D, createCanvas } from "canvas"
import {
  CommandInteraction,
  Message,
  MessageAttachment,
  MessageOptions,
} from "discord.js"
import squarify, { Input } from "squarify"
import defi from "../../../adapters/defi"
import { APIError } from "../../../errors"
import { RunResult } from "../../../types/common"
import { heightOf, widthOf } from "../../../ui/canvas/calculator"
import { drawRectangle } from "../../../ui/canvas/draw"
import { composeEmbedMessage } from "../../../ui/discord/embed"
import { emojis, getAuthor, getEmojiURL } from "../../../utils/common"
import chroma from "chroma-js"
import CacheManager from "../../../cache/node-cache"

export async function heatmap(
  msgOrInteraction: Message | CommandInteraction,
): Promise<RunResult<MessageOptions>> {
  const {
    data,
    ok,
    curl,
    log,
    status = 500,
    error,
  } = await defi.getCoinsMarketData()
  if (!ok)
    throw new APIError({
      msgOrInteraction,
      curl,
      description: log,
      status,
      error,
    })

  const embed = composeEmbedMessage(null, {
    author: ["Heatmap Crypto", getEmojiURL(emojis.MOCHI_CIRCLE)],
    originalMsgAuthor: getAuthor(msgOrInteraction),
    image: "attachment://heatmap.png",
  })
  const filtered = Object.values(data).filter(
    (i) =>
      !["busd", "tusd", "usdc", "usdt", "dai", "frax"].includes(
        i.symbol.toLowerCase(),
      ),
  )
  const now = new Date()
  const key = `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDate()}`
  const buffer = await CacheManager.get({
    pool: "heatmap",
    key,
    call: () => render(filtered),
    ttl: 21600, // 6h
  })
  return {
    messageOptions: {
      embeds: [embed],
      files: [new MessageAttachment(buffer, "heatmap.png")],
    },
  }
}

async function render(data: any[]) {
  const container = { x0: 0, y0: 0, x1: 1500, y1: 1200 }
  const { x0, y0, x1, y1 } = container
  const [l, w] = [x1 - x0, y1 - y0]

  // const totalArea = container.length * container.width
  const totalMarketCap = data.reduce((acc, cur) => acc + cur.market_cap, 0)
  const ratios = data.map((item) => item.market_cap / totalMarketCap)
  // const areas = ratios.map((r) => r * totalArea)
  const input: Input<Custom>[] = data.map((item, i) => {
    return {
      symbol: item.symbol.toUpperCase(),
      value: item.market_cap,
      // value: ratios[i],
      price: `$${item.current_price.toLocaleString()}`,
      color: getColorScale(item.price_change_percentage_24h),
      change_1d: `${item.price_change_percentage_24h.toFixed(2)}%`,
      change_prefix: item.price_change_percentage_24h >= 0 ? "+" : "",
      ratio: ratios[i],
    }
  })

  const output = squarify<Custom>(input, container)
  const canvas = createCanvas(l, w)
  const ctx = canvas.getContext("2d")
  output.forEach((item) => {
    const fontSize = adjustFont(ctx, item.x1 - item.x0, 300, item.symbol)
    drawRectangle(
      ctx,
      {
        x: { from: item.x0, to: item.x1 },
        y: { from: item.y0, to: item.y1 },
        w: l,
        h: w,
        radius: 0,
      },
      item.color,
      "white",
    )

    // price (2nd line)
    ctx.font = `${fontSize * 0.6}px Manrope`
    const priceH = heightOf(ctx, item.price)
    const priceW = widthOf(ctx, item.price)
    const price = {
      text: item.price,
      x: item.x0 + (item.x1 - item.x0) / 2 - priceW / 2,
      y: item.y0 + (item.y1 - item.y0) / 2 + priceH / 2,
      font: ctx.font,
    }

    // symbol (1st line)
    ctx.font = `bold ${fontSize}px Manrope`
    // const symbolH = heightOf(ctx, item.symbol)
    const symbolW = widthOf(ctx, item.symbol)
    const symbol = {
      text: item.symbol,
      x: item.x0 + (item.x1 - item.x0) / 2 - symbolW / 2,
      y: price.y - priceH - 0.1 * fontSize,
      font: ctx.font,
    }

    // change percentage (3rd line)
    ctx.font = `${fontSize * 0.6}px Manrope`
    const changeText = `${item.change_prefix}${item.change_1d}`
    const changeH = heightOf(ctx, changeText)
    const changeW = widthOf(ctx, changeText)
    const change = {
      text: changeText,
      x: item.x0 + (item.x1 - item.x0) / 2 - changeW / 2,
      y: price.y + changeH + 0.15 * fontSize,
      font: ctx.font,
    }

    // fill text
    ctx.fillStyle = "white"
    ctx.font = symbol.font
    ctx.fillText(symbol.text, symbol.x, symbol.y)
    ctx.font = price.font
    ctx.fillText(price.text, price.x, price.y)
    ctx.font = change.font
    ctx.fillText(change.text, change.x, change.y)
  })

  return canvas.toBuffer()
}

function getColorScale(change: number): string {
  const c = Math.abs(change / 10)
  if (change <= 0.05 && change >= -0.05) return "gray"
  if (change > 0) return chroma.scale(["#5cc489", "#337350"])(c).hex()
  return chroma.scale(["#b52d29", "#7a0d0a"])(c).hex()
}

function adjustFont(
  ctx: CanvasRenderingContext2D,
  l: number,
  fontSize: number,
  text: string,
): number {
  // minimum font size is 1
  if (fontSize === 0) return 1
  ctx.font = `bold ${fontSize}px Manrope`
  const w = widthOf(ctx, text)
  // if text width > 40% of its container's length -> fontSize -= 1
  if (w > 0.4 * l) {
    return adjustFont(ctx, l, fontSize - 1, text)
  }
  // else -> use this
  return fontSize
}

type Custom = {
  symbol: string
  price: string
  change_1d: string
  change_prefix: string
  color: string
  ratio: number
}
