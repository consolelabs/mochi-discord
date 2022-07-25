import {
  createCanvas,
  Image,
  loadImage,
  CanvasRenderingContext2D,
  registerFont,
} from "canvas"
import { Message, MessageAttachment } from "discord.js"
import { AssetNotFoundError } from "errors/AssetNotFoundError"
import {
  airdropper,
  bomb,
  empty,
  Game,
  megaBomb,
  PieceEnum,
  rerollBox,
  teleportPortal,
  terraformer,
} from "triple-pod-game-engine"
import { RectangleStats } from "types/canvas"
import { drawRectangle, fillWrappedText, heightOf, widthOf } from "utils/canvas"
import ChannelLogger from "utils/ChannelLogger"
import { mappings } from "./mappings"
import sharp from "sharp"

export const shopItems = [
  {
    ...airdropper,
    desc: "Clone a piece on the board",
    price: 1000,
  },
  {
    ...rerollBox,
    desc: "Get another item randomly",
    price: 1000,
  },
  {
    ...teleportPortal,
    desc: "Swap 2 pieces on the board",
    price: 1000,
  },
  {
    ...terraformer,
    desc: "Destroy all marbles",
    price: 1000,
  },
  {
    ...megaBomb,
    desc: "Destroy a 2x2 area",
    price: 1000,
  },
  {
    ...bomb,
    desc: "Destroy a 1x1 area",
    price: 1000,
  },
]

const headerHeight = 190
const boardPadding = 80

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
  radius: 30,
  bgColor: "#4C628A",
}

const board: RectangleStats = {
  x: {
    from: 0,
    to: 1500,
  },
  y: {
    from: 0,
    to: container.h,
  },
  w: 1500,
  h: 1500,
  radius: 0,
}

const shop: RectangleStats = {
  x: {
    from: 1450,
    to: 2300,
  },
  y: {
    from: container.y.from + 400,
    to: outerContainer.h,
  },
  w: 800,
  h: 0,
  radius: 0,
}

const tileSize = (board.w - boardPadding * 2) / 6

type Asset = Partial<{
  images: Partial<Record<PieceEnum, { image: Image; highlighted?: Image }>>
  background: Image
  titleImage: Image
  coin: Image
  disk: Image
  numbers: {
    one?: Image
    two?: Image
    three?: Image
    four?: Image
    five?: Image
    six?: Image
  }
  font: boolean
}>

const assets: Asset = {
  images: {},
  numbers: {},
  font: false,
}

let template: Image
// template mode means that we're generating a template with no actual data
const templateMode = false

async function loadAssets(message: Message) {
  try {
    if (!assets.font) {
      registerFont("src/assets/fonts/whitneylight.otf", {
        family: "Whitney",
        weight: "light",
      })
      registerFont("src/assets/fonts/whitneysemibold.otf", {
        family: "Whitney",
        weight: "semibold",
      })
      assets.font = true
    }
    if (!template) {
      template = await loadImage("src/assets/triple-town/template.png")
    }

    if (Object.keys(assets.images).length === 0) {
      const promises = Object.entries(mappings).map(
        async ([id, { noHighlight, image: imageUrl }]) => {
          const image = await loadImage(
            `src/assets/triple-town/pieces/${imageUrl}`
          )
          let highlighted
          if (!noHighlight) {
            highlighted = await loadImage(
              `src/assets/triple-town/pieces/highlighted/${imageUrl}`
            )
          }
          assets.images[id as unknown as PieceEnum] = {
            image,
            ...(highlighted && !noHighlight ? { highlighted } : {}),
          }
        }
      )
      await Promise.all(promises)
    }
    if (templateMode) {
      if (Object.keys(assets.numbers).length === 0) {
        const promises = numToText.map(async (n) => {
          const image = await loadImage(`src/assets/triple-town/${n}.png`)
          assets.numbers[n as keyof typeof assets.numbers] = image
        })
        await Promise.all(promises)
      }

      if (!assets.background) {
        assets.background = await loadImage(
          "src/assets/triple-town/background.png"
        )
      }

      if (!assets.titleImage) {
        assets.titleImage = await loadImage("src/assets/triple-town/text.png")
      }

      if (!assets.coin) {
        assets.coin = await loadImage("src/assets/triple-town/coins.png")
      }

      if (!assets.disk) {
        assets.disk = await loadImage("src/assets/triple-town/disk.png")
      }
    }
  } catch (e: any) {
    if ("path" in e) {
      ChannelLogger.log(new AssetNotFoundError({ message, assetName: e.path }))
    }
  }
}

function drawBoard(ctx: CanvasRenderingContext2D) {
  drawRectangle(ctx, container, container.bgColor)
  ctx.save()
  ctx.clip()
  ctx.drawImage(
    assets.background,
    container.x.from,
    container.y.from,
    board.w,
    board.h
  )
  ctx.restore()
  new Array(6)
    .fill(tileSize)
    .map((t, i) => t * (i + 1))
    .forEach((t, i) => {
      // vertical
      ctx.strokeStyle = "#25305A"
      ctx.lineWidth = 3
      if (i !== 5) {
        ctx.beginPath()
        ctx.moveTo(t + boardPadding, boardPadding + container.y.from)
        ctx.lineTo(t + boardPadding, board.h - boardPadding + container.y.from)
        ctx.stroke()
        ctx.closePath()
        ctx.save()
      }

      // horizontal
      if (i !== 5) {
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

// function drawTitle(ctx: CanvasRenderingContext2D) {
//   ctx.drawImage(
//     assets.titleImage,
//     board.w / 2 - 853 / 2,
//     headerHeight + 120 - 105 / 2,
//     853,
//     105
//   )
// }

const numToText = ["one", "two", "three", "four", "five", "six"]

function drawShop(ctx: CanvasRenderingContext2D) {
  ctx.font = "bold 90px Whitney"
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

  ctx.font = "50px Whitney"
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
      radius: 10,
    },
    "#283755"
  )
  y = fillWrappedText(
    ctx,
    command,
    shop.x.from + 60,
    y + heightOfTitle - 5,
    container.w - padding * 2 - board.w
  )

  ctx.font = "65px Whitney"
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

  const itemSize = (outerContainer.h - padding - (y + 50)) / 6
  const x = shop.x.from + padding + 10
  y += 50

  shopItems.forEach((item, idx) => {
    ctx.drawImage(assets.images[item.id].image, x, y, itemSize, itemSize)
    ctx.font = "45px Whitney"
    ctx.fillStyle = "#ffffff"
    fillWrappedText(
      ctx,
      mappings[item.id].name,
      x + itemSize + 20,
      y + itemSize / 3,
      shop.w - 50
    )
    ctx.font = "35px Whitney"
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
    fillWrappedText(
      ctx,
      item.desc,
      x + itemSize + 20,
      y + itemSize / 1.7,
      shop.w - 50 - itemSize
    )
    ctx.drawImage(assets.coin, x + itemSize + 20, y + itemSize / 1.45, 32, 32)
    ctx.fillStyle = "#FFDE6A"
    fillWrappedText(
      ctx,
      "1,000",
      x + itemSize + 32 + 20 + 10,
      y + itemSize / 1.15,
      shop.w - 50 - itemSize - 32
    )
    const numbering =
      assets.numbers[numToText[idx] as keyof typeof assets.numbers]
    if (numbering) {
      ctx.drawImage(
        numbering,
        outerContainer.w - 50 - padding - 48,
        y + itemSize / 3,
        48,
        48
      )
    }
    y += itemSize
  })
}

function drawPieces(ctx: CanvasRenderingContext2D, game: Game) {
  const [x, y] = game.state.lastActionPos
  const lastPiece = game.state.board[y][x]

  game.state.board.forEach((row, i) => {
    row.forEach((cell, j) => {
      let image = assets.images[cell.id].image
      if (i === 0 && j === 0) {
        image = assets.images[game.state.swapPiece?.id ?? empty.id].image
      } else if (j === x && i === y) {
        const highlighted = assets.images[lastPiece.id].highlighted
        if (highlighted) {
          image = highlighted
        }
      }
      if (image) {
        const horizontalOffset = (image.width - tileSize) / 2
        ctx.drawImage(
          image,
          j * tileSize + boardPadding - horizontalOffset,
          i * tileSize +
            boardPadding +
            container.y.from -
            (image.height - tileSize) +
            horizontalOffset,
          image.width,
          image.height
        )
      }
    })
  })
}

function drawAssitMode(ctx: CanvasRenderingContext2D, fullMap = false) {
  ctx.font = "50px Whitney"
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)"

  const texts = ["a", "b", "c", "d", "e", "f"]
  const numbers = new Array(6).fill(0).map((_, i) => i + 1)

  for (const [y, num] of numbers.entries()) {
    for (const [x, text] of texts.entries()) {
      let fullText = `${text}${num}`
      if ((x === 0 || y === 0) && !fullMap) {
        if (x !== 0 || y !== 0) {
          fullText = x === 0 ? String(num) : text
        }
        fillWrappedText(
          ctx,
          fullText,
          tileSize - 10 + boardPadding + x * tileSize - widthOf(ctx, fullText),
          board.h -
            180 -
            boardPadding -
            y * tileSize -
            heightOf(ctx, fullText) +
            container.y.from,
          widthOf(ctx, fullText)
        )
      } else if (fullMap) {
        fillWrappedText(
          ctx,
          fullText,
          tileSize - 10 + boardPadding + x * tileSize - widthOf(ctx, fullText),
          board.h -
            180 -
            boardPadding -
            y * tileSize -
            heightOf(ctx, fullText) +
            container.y.from,
          widthOf(ctx, fullText)
        )
      }
    }
  }
}

function drawCurrentPiece(ctx: CanvasRenderingContext2D, game: Game) {
  if (templateMode) {
    drawRectangle(
      ctx,
      {
        x: {
          from: 0,
          to: outerContainer.w / 3 - 10,
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
  } else {
    const pieceImage = assets.images[game.state.currentPiece.id].image
    ctx.drawImage(pieceImage, 0, (170 - 10) / 2 - 96, 192, 192)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 60px Whitney"
    const text = mappings[game.state.currentPiece.id].name
    const numOfNewLines = Math.max(1, text.split(" ").length - 1) - 1
    const heightOfText = heightOf(ctx, text)
    fillWrappedText(
      ctx,
      text,
      50 + 140,
      heightOfText / 2 + 170 / (2 + numOfNewLines),
      outerContainer.w / 3 - 192 - 50
    )
  }
}

function drawPoints(ctx: CanvasRenderingContext2D, points: number) {
  const x = outerContainer.w / 3 + 10
  if (templateMode) {
    drawRectangle(
      ctx,
      {
        x: {
          from: x,
          to: (outerContainer.w * 2) / 3 - 10,
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
  } else {
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 90px Whitney"
    const pointsNum = String(points)
    const widthOfPointsNum = widthOf(ctx, pointsNum)
    const heightOfPointsNum = heightOf(ctx, pointsNum)
    fillWrappedText(
      ctx,
      pointsNum,
      x + 50,
      (170 - 10) / 2 - heightOfPointsNum / 2,
      widthOfPointsNum
    )
  }

  if (templateMode) {
    ctx.font = "semibold 60px Whitney"
    ctx.fillStyle = "#8B8B8B"
    const pointText = "Points"
    const widthOfPointText = widthOf(ctx, pointText)
    const heightOfPointText = heightOf(ctx, pointText)
    fillWrappedText(
      ctx,
      pointText,
      (outerContainer.w * 2) / 3 - 10 - 50 - widthOfPointText,
      (170 - 10) / 2 - heightOfPointText / 2,
      widthOfPointText
    )
  }
}

function drawCoins(ctx: CanvasRenderingContext2D, coins: number | string) {
  const x = (outerContainer.w * 2) / 3 + 10
  if (templateMode) {
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
    ctx.drawImage(assets.coin, x + 50, 170 / 2 - 32, 64, 64)
  } else {
    ctx.fillStyle = "#FFDE6A"
    ctx.font = "bold 70px Whitney"
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
  }

  if (templateMode) {
    ctx.font = "semibold 60px Whitney"
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
}

function drawSwapDisk(ctx: CanvasRenderingContext2D) {
  ctx.drawImage(
    assets.disk,
    boardPadding,
    boardPadding + container.y.from,
    tileSize,
    tileSize
  )
}

export async function toCanvas(
  game: Game,
  msg: Message,
  bal: number | string = "Unlimited"
) {
  await loadAssets(msg)

  const canvas = createCanvas(outerContainer.w, outerContainer.h)
  const ctx = canvas.getContext("2d")
  if (templateMode) {
    drawRectangle(ctx, outerContainer, outerContainer.bgColor)
  } else {
    ctx.drawImage(template, 0, 0, outerContainer.w, outerContainer.h)
  }

  drawCurrentPiece(ctx, game)
  drawPoints(ctx, game.state.points)
  drawCoins(ctx, bal)

  if (templateMode) {
    drawBoard(ctx)
    // drawTitle(ctx)
    drawShop(ctx)
    drawAssitMode(ctx, true)
    drawSwapDisk(ctx)
  } else {
    drawPieces(ctx, game)
  }

  const buffer = canvas.toBuffer()

  const bufferCompressed = await sharp(buffer)
    .resize(
      Math.round(outerContainer.w / 2.5),
      Math.round(outerContainer.h / 2.5)
    )
    .toBuffer()

  return new MessageAttachment(bufferCompressed, "board.png")
}
