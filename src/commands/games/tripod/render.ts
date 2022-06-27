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
import { drawRectangle, heightOf, widthOf } from "utils/canvas"
import { composeSimpleSelection } from "utils/discordEmbed"

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

const mappings: Record<PieceEnum, { name: string; image: string }> = {
  [PieceEnum.EMPTY]: {
    name: "Empty",
    image: "empty.png",
  },
  [PieceEnum.GRASS]: {
    name: "Grass",
    image: "grass.png",
  },
  [PieceEnum.BUSH]: {
    name: "Bush",
    image: "bush.png",
  },
  [PieceEnum.SUPER_BUSH]: {
    name: "Cyber Bush",
    image: "cyber-bush.png",
  },
  [PieceEnum.TREE]: {
    name: "Tree",
    image: "tree.png",
  },
  [PieceEnum.SUPER_TREE]: {
    name: "Cyber Tree",
    image: "cyber-tree.png",
  },
  [PieceEnum.HUT]: {
    name: "hut",
    image: "hut.png",
  },
  [PieceEnum.SUPER_HUT]: {
    name: "Cyber Hut",
    image: "cyber-hut.png",
  },
  [PieceEnum.HOUSE]: {
    name: "House",
    image: "pod.png",
  },
  [PieceEnum.SUPER_HOUSE]: {
    name: "Cyber House",
    image: "cyber-pod.png",
  },
  [PieceEnum.MANSION]: {
    name: "Condo",
    image: "condo.png",
  },
  [PieceEnum.SUPER_MANSION]: {
    name: "Cyber Condo",
    image: "cyber-condo.png",
  },
  [PieceEnum.CASTLE]: {
    name: "Apartment",
    image: "apartment.png",
  },
  [PieceEnum.SUPER_CASTLE]: {
    name: "Cyber Apartment",
    image: "cyber-apartment.png",
  },
  [PieceEnum.FLOATING_CASTLE]: {
    name: "Tower",
    image: "tower.png",
  },
  [PieceEnum.SUPER_FLOATING_CASTLE]: {
    name: "Cyber Tower",
    image: "cyber-tower.png",
  },
  [PieceEnum.TRIPLE_CASTLE]: {
    name: "Fortress",
    image: "fortress.png",
  },
  [PieceEnum.BEAR]: {
    name: "Droid",
    image: "droid.png",
  },
  [PieceEnum.NINJA_BEAR]: {
    name: "Rocket Droid",
    image: "rocket-droid.png",
  },
  [PieceEnum.TOMB]: {
    name: "Shard",
    image: "shard.png",
  },
  [PieceEnum.CHURCH]: {
    name: "Gem",
    image: "gem.png",
  },
  [PieceEnum.CATHEDRAL]: {
    name: "Crystal",
    image: "crystal.png",
  },
  [PieceEnum.CRYSTAL]: {
    name: "Slime",
    image: "slime.png",
  },
  [PieceEnum.ROCK]: {
    name: "Marble Piece",
    image: "marble-piece.png",
  },
  [PieceEnum.MOUNTAIN]: {
    name: "Marble Chunk",
    image: "marble-chunk.png",
  },
  [PieceEnum.TREASURE]: {
    name: "Chest",
    image: "chest.png",
  },
  [PieceEnum.LARGE_TREASURE]: {
    name: "Cyber Chest",
    image: "cyber-chest.png",
  },
  [PieceEnum.ROBOT]: {
    name: "Bomb",
    image: "bomb.png",
  },
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
    background = await loadImage("src/assets/triple-town/background.jpeg")
  }
  ctx.drawImage(background, 0, 200, 1300, 1300)

  new Array(6)
    .fill(200)
    .map((t, i) => t * (i + 1))
    .forEach((t, i) => {
      // vertical
      if (i !== 5) {
        ctx.strokeStyle = "#a1a1a1"
        ctx.beginPath()
        ctx.moveTo(t + 50, 250)
        ctx.lineTo(t + 50, container.h - 50)
        ctx.stroke()
        ctx.closePath()
        ctx.save()
      }

      // horizontal
      if (i !== 0) {
        ctx.beginPath()
        ctx.moveTo(50, t + 50)
        ctx.lineTo(container.w - 50, t + 50)
        ctx.stroke()
        ctx.closePath()
        ctx.save()
      }
    })

  ctx.font = "80px Arial"
  ctx.fillStyle = "#000"
  const name = mappings[game.state.currentPiece.id].name
  const widthOfText = widthOf(ctx, name)
  const heightOfText = heightOf(ctx, name)
  const start = 600 - (widthOfText + 300) / 2

  ctx.drawImage(images[game.state.currentPiece.id], start, 0, 200, 200)
  ctx.fillText(
    name,
    start + 200,
    heightOfText + (100 - heightOfText / 2),
    widthOfText
  )

  game.state.board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (i === 0 && j === 0) {
        ctx.drawImage(
          images[game.state.swapPiece?.id ?? empty.id],
          j * 200 + 50,
          i * 200 + 250,
          200,
          200
        )
      } else {
        ctx.drawImage(images[cell.id], j * 200 + 50, i * 200 + 250, 200, 200)
      }
    })
  })

  return new MessageAttachment(canvas.toBuffer(), "board.png")
}
