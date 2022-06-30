import { createCanvas, Image, loadImage } from "canvas"
import { MessageAttachment } from "discord.js"
import {
  bush,
  crystal,
  empty,
  Game,
  grass,
  PieceEnum,
  robot,
  tree,
} from "triple-pod-game-engine"
import { RectangleStats } from "types/canvas"
import { drawRectangle, fillWrappedText, heightOf, widthOf } from "utils/canvas"
import { composeSimpleSelection } from "utils/discordEmbed"
import { mappings } from "./mappings"

const container: RectangleStats = {
  x: {
    from: 0,
    to: 1300,
  },
  y: {
    from: 0,
    to: 1500,
  },
  w: 0,
  h: 0,
  pt: 0,
  pl: 0,
  radius: 0,
  bgColor: "rgba(255, 255, 255, 1)",
}

const images: Partial<Record<PieceEnum, Image>> = {}
let background: Image

export const shop = [grass, bush, tree, crystal, robot]

export function renderShop() {
  return `[\`Shop\`](https://pod.town)\n${composeSimpleSelection(
    shop.map((i) => mappings[i.id].name)
  )}`
}

export async function toCanvas(game: Game) {
  if (Object.keys(images).length === 0) {
    const promises = Object.entries(mappings).map(
      async ([id, { image: imageUrl }]) => {
        const image = await loadImage(
          `src/assets/triple-town/pieces/${imageUrl}`
        )
        images[id as unknown as PieceEnum] = image
      }
    )
    await Promise.all(promises)
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  drawRectangle(ctx, container, container.bgColor)
  if (!background) {
    background = await loadImage("src/assets/triple-town/background.jpg")
  }
  ctx.drawImage(background, 0, 0, container.w, container.h)

  const boardPadding = 60

  new Array(6)
    .fill(200)
    .map((t, i) => t * (i + 1))
    .forEach((t, i) => {
      // vertical
      if (i !== 5) {
        ctx.strokeStyle = "#a1a1a1"
        ctx.beginPath()
        ctx.moveTo(t + boardPadding, 200 + boardPadding)
        ctx.lineTo(t + boardPadding, container.h - boardPadding)
        ctx.stroke()
        ctx.closePath()
        ctx.save()
      }

      // horizontal
      if (i !== 0) {
        ctx.beginPath()
        ctx.moveTo(boardPadding, t + boardPadding)
        ctx.lineTo(container.w - boardPadding, t + boardPadding)
        ctx.stroke()
        ctx.closePath()
        ctx.save()
      }
    })

  ctx.font = "80px Arial"
  ctx.fillStyle = "#ffffff"
  const name = mappings[game.state.currentPiece.id].name
  const widthOfText = widthOf(ctx, name)
  const heightOfText = heightOf(ctx, name)
  const start = 600 - (widthOfText + 200) / 2

  ctx.drawImage(images[game.state.currentPiece.id], start, 25, 200, 200)
  ctx.fillText(
    name,
    start + 200,
    heightOfText + (125 - heightOfText / 2),
    widthOfText
  )

  // highlight last move's position
  const lastMove = game.history.reverse().find((m) => m.type === "put")
  if (lastMove?.type === "put") {
    const { x, y } = lastMove
    ctx.fillStyle = "rgba(251, 97, 73, 0.4)"
    ctx.fillRect(x * 200 + boardPadding, y * 200 + 200 + boardPadding, 200, 200)
  }

  game.state.board.forEach((row, i) => {
    row.forEach((cell, j) => {
      let image = images[cell.id]
      if (i === 0 && j === 0) {
        image = images[game.state.swapPiece?.id ?? empty.id]
      }
      ctx.drawImage(
        image,
        j * 200 + boardPadding,
        i * 200 + 200 + boardPadding,
        200,
        200
      )
    })
  })

  ctx.font = "50px Arial"
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)"

  const texts = ["a", "b", "c", "d", "e", "f"]

  for (let i = 0; i < 6; i++) {
    let text = `${i + 1}${texts[i]}`
    if (i === 0) {
      fillWrappedText(
        ctx,
        text,
        180 + boardPadding - widthOf(ctx, text),
        1310 - heightOf(ctx, text),
        widthOf(ctx, text)
      )
    } else {
      text = `${i + 1}`
      fillWrappedText(
        ctx,
        text,
        180 + boardPadding - widthOf(ctx, text),
        1310 - i * 200 - heightOf(ctx, text),
        widthOf(ctx, text)
      )

      text = `${texts[i]}`
      fillWrappedText(
        ctx,
        text,
        180 + boardPadding + i * 200 - widthOf(ctx, text),
        1310 - heightOf(ctx, text),
        widthOf(ctx, text)
      )
    }
  }

  return new MessageAttachment(canvas.toBuffer(), "board.png")
}
