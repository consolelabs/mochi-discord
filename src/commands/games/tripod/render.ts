import {
  createCanvas,
  Image,
  loadImage,
  CanvasRenderingContext2D,
} from "canvas"
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
import { mappings } from "./mappings"

const headerHeight = 190
const boardPadding = 60
const tileSize = 200

const outerContainer: RectangleStats = {
  x: {
    from: 0,
    to: 2300,
  },
  y: {
    from: 0,
    to: 1690,
  },
  w: 2300,
  h: 1690,
  pt: 0,
  pl: 0,
  radius: 0,
  bgColor: "#2F3136",
}

const container: RectangleStats = {
  x: {
    ...outerContainer.x,
  },
  y: {
    from: headerHeight,
    to: 2000,
  },
  w: outerContainer.w,
  h: outerContainer.h - headerHeight,
  pt: 0,
  pl: 0,
  radius: 0,
  bgColor: "#4C628A",
}

const board: RectangleStats = {
  x: {
    from: 0,
    to: 1300,
  },
  y: {
    from: 0,
    to: container.h,
  },
  w: 1300,
  h: 1500,
  radius: 0,
}

const shop: RectangleStats = {
  x: {
    from: 1300,
    to: 2300,
  },
  y: {
    from: container.y.from + 400,
    to: outerContainer.h,
  },
  w: 1000,
  h: 0,
  radius: 0,
}

type Asset = Partial<{
  images: Partial<Record<PieceEnum, { image: Image; highlighted?: Image }>>
  background: Image
  titleImage: Image
  coin: Image
}>

const assets: Asset = {
  images: {},
}

async function loadAssets() {
  if (Object.keys(assets.images).length === 0) {
    const promises = Object.entries(mappings).map(
      async ([id, { image: imageUrl }]) => {
        const image = await loadImage(
          `src/assets/triple-town/pieces/${imageUrl}`
        )
        const highlighted = await loadImage(
          `src/assets/triple-town/pieces/highlighted/${imageUrl}`
        )
        assets.images[id as unknown as PieceEnum] = {
          image,
          ...(highlighted ? { highlighted } : {}),
        }
      }
    )
    await Promise.all(promises)
  }

  if (!assets.background) {
    assets.background = await loadImage("src/assets/triple-town/background.png")
  }

  if (!assets.titleImage) {
    assets.titleImage = await loadImage("src/assets/triple-town/text.png")
  }

  if (!assets.coin) {
    assets.coin = await loadImage("src/assets/triple-town/coins.png")
  }
}

function drawBoard(ctx: CanvasRenderingContext2D) {
  ctx.drawImage(
    assets.background,
    container.x.from,
    container.y.from,
    board.w,
    board.h
  )
  new Array(6)
    .fill(tileSize)
    .map((t, i) => t * (i + 1))
    .forEach((t, i) => {
      // vertical
      if (i !== 5) {
        ctx.lineWidth = 3
        ctx.strokeStyle = "#9FD0F0"
        ctx.beginPath()
        ctx.moveTo(t + boardPadding, tileSize + boardPadding + container.y.from)
        ctx.lineTo(t + boardPadding, board.h - boardPadding + container.y.from)
        ctx.stroke()
        ctx.closePath()
        ctx.save()
      }

      // horizontal
      if (i !== 0) {
        ctx.beginPath()
        ctx.moveTo(boardPadding, t + boardPadding + container.y.from)
        ctx.lineTo(board.w - boardPadding, t + boardPadding + container.y.from)
        ctx.stroke()
        ctx.closePath()
        ctx.save()
      }
    })
  ctx.lineWidth = 1
}

function drawTitle(ctx: CanvasRenderingContext2D) {
  ctx.drawImage(
    assets.titleImage,
    board.w / 2 - 853 / 2,
    headerHeight + 120 - 105 / 2,
    853,
    105
  )
}

function drawShop(ctx: CanvasRenderingContext2D) {
  ctx.font = "bold 90px Arial"
  ctx.fillStyle = "#ffffff"
  const padding = 50
  let y = container.y.from + 130
  const title = "Shop"
  const heightOfTitle = heightOf(ctx, title)
  fillWrappedText(
    ctx,
    title,
    shop.x.from + padding,
    y,
    container.w - padding * 2 - board.w
  )

  ctx.font = "60px Arial"
  const command = "buy <number>"
  const heightOfCommand = heightOf(ctx, command)
  const widthOfCommand = widthOf(ctx, command)

  drawRectangle(
    ctx,
    {
      x: {
        from: shop.x.from + padding,
        to: shop.x.from + padding + widthOfCommand + 20,
      },
      y: { from: y + 30, to: y + 40 + heightOfCommand },
      h: 0,
      w: 0,
      radius: 5,
    },
    "#283755"
  )
  y = fillWrappedText(
    ctx,
    command,
    shop.x.from + 60,
    y + heightOfTitle,
    container.w - padding * 2 - board.w
  )

  ctx.font = "65px Arial"
  const description = "to buy specific items for use on your map."

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
  y = fillWrappedText(
    ctx,
    description,
    shop.x.from + padding,
    y + heightOfCommand + 20,
    container.w - padding * 2 - board.w
  )

  // body
  drawRectangle(
    ctx,
    {
      x: { from: shop.x.from + padding, to: container.w - padding },
      y: { from: y + 30, to: outerContainer.h - padding },
      h: 0,
      w: 0,
      radius: 20,
    },
    "#283755"
  )
}

function drawPieces(ctx: CanvasRenderingContext2D, game: Game) {
  game.state.board.forEach((row, i) => {
    row.forEach((cell, j) => {
      let image = assets.images[cell.id].image
      if (i === 0 && j === 0) {
        image = assets.images[game.state.swapPiece?.id ?? empty.id].image
      }
      ctx.drawImage(
        image,
        j * tileSize + boardPadding,
        i * tileSize + 200 + boardPadding + container.y.from,
        tileSize,
        tileSize
      )
    })
  })
}

function highlightLastMove(ctx: CanvasRenderingContext2D, game: Game) {
  // replace last move's piece with the highlighted version
  const lastMove = game.history.reverse().find((m) => m.type === "put")
  if (lastMove?.type === "put") {
    const { x, y } = lastMove
    const lastPiece = game.state.board[y][x]
    const image = assets.images[lastPiece.id].highlighted
    if (image) {
      ctx.drawImage(
        image,
        x * tileSize + boardPadding,
        y * tileSize + 200 + boardPadding + container.y.from,
        tileSize,
        tileSize
      )
    }
  }
}

function drawAssitMode(ctx: CanvasRenderingContext2D) {
  ctx.font = "50px Arial"
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)"

  const texts = ["a", "b", "c", "d", "e", "f"]

  for (let i = 0; i < 6; i++) {
    let text = `${i + 1}${texts[i]}`
    if (i === 0) {
      fillWrappedText(
        ctx,
        text,
        180 + boardPadding - widthOf(ctx, text),
        1310 - heightOf(ctx, text) + container.y.from,
        widthOf(ctx, text)
      )
    } else {
      text = `${i + 1}`
      fillWrappedText(
        ctx,
        text,
        180 + boardPadding - widthOf(ctx, text),
        1310 - i * tileSize - heightOf(ctx, text) + container.y.from,
        widthOf(ctx, text)
      )

      text = `${texts[i]}`
      fillWrappedText(
        ctx,
        text,
        180 + boardPadding + i * tileSize - widthOf(ctx, text),
        1310 - heightOf(ctx, text) + container.y.from,
        widthOf(ctx, text)
      )
    }
  }
}

function drawPoints(ctx: CanvasRenderingContext2D, points: number) {
  drawRectangle(
    ctx,
    {
      x: {
        from: 0,
        to: outerContainer.w / 2 - 10,
      },
      y: {
        from: 0,
        to: 170,
      },
      w: 0,
      h: 0,
      radius: 20,
    },
    "#222428"
  )
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 90px Arial"
  const pointsNum = String(points)
  const widthOfPointsNum = widthOf(ctx, pointsNum)
  const heightOfPointsNum = heightOf(ctx, pointsNum)
  fillWrappedText(
    ctx,
    pointsNum,
    50,
    (170 - 10) / 2 - heightOfPointsNum / 2,
    widthOfPointsNum
  )

  ctx.font = "semibold 60px Arial"
  ctx.fillStyle = "#8B8B8B"
  const pointText = "Points"
  const widthOfPointText = widthOf(ctx, pointText)
  const heightOfPointText = heightOf(ctx, pointText)
  fillWrappedText(
    ctx,
    pointText,
    outerContainer.w / 2 - 10 - 50 - widthOfPointText,
    (170 - 10) / 2 - heightOfPointText / 2,
    widthOfPointText
  )
}

function drawCoins(ctx: CanvasRenderingContext2D, coins: number) {
  const x = outerContainer.w / 2 + 10
  drawRectangle(
    ctx,
    {
      x: {
        from: x,
        to: outerContainer.w,
      },
      y: {
        from: 0,
        to: 170,
      },
      w: 0,
      h: 0,
      radius: 20,
    },
    "#222428"
  )
  ctx.fillStyle = "#FFDE6A"
  ctx.font = "bold 70px Arial"
  ctx.drawImage(assets.coin, x + 50, 170 / 2 - 32, 64, 64)
  const coinsNum = String(coins)
  const widthOfCoinsNum = widthOf(ctx, coinsNum)
  const heightOfCoinsNum = heightOf(ctx, coinsNum)
  fillWrappedText(
    ctx,
    coinsNum,
    x + 50 + 90,
    (170 - 10) / 2 - heightOfCoinsNum / 2,
    widthOfCoinsNum
  )

  ctx.font = "semibold 60px Arial"
  ctx.fillStyle = "#8B8B8B"
  const coinsText = "Coins"
  const widthOfCoinsText = widthOf(ctx, coinsText)
  const heightOfCoinsText = heightOf(ctx, coinsText)
  fillWrappedText(
    ctx,
    coinsText,
    outerContainer.w - 10 - 50 - widthOfCoinsText,
    (170 - 10) / 2 - heightOfCoinsText / 2,
    widthOfCoinsText
  )
}

export const shopItems = [grass, bush, tree, crystal, robot]

export async function toCanvas(game: Game) {
  await loadAssets()

  const canvas = createCanvas(outerContainer.w, outerContainer.h)
  const ctx = canvas.getContext("2d")
  drawRectangle(ctx, outerContainer, outerContainer.bgColor)
  drawRectangle(ctx, container, container.bgColor)

  drawPoints(ctx, game.state.points)
  drawCoins(ctx, 3989)

  drawBoard(ctx)
  drawTitle(ctx)
  drawShop(ctx)
  drawPieces(ctx, game)
  highlightLastMove(ctx, game)
  drawAssitMode(ctx)

  return new MessageAttachment(canvas.toBuffer(), "board.png")
}
