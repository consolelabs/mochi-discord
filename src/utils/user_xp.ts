import {
  CanvasRenderingContext2D,
  createCanvas,
  loadImage,
  registerFont
} from "canvas"
import { MessageEmbed, MessageAttachment, ColorResolvable } from "discord.js"
import { msgColors } from "./common"

registerFont("src/assets/DelaGothicOne-Regular.ttf", {
  family: "Dela Gothic One"
})

export async function composeLevelUpMessage(
  authorId: string,
  avatarId: string,
  level: number
) {
  return {
    embeds: [
      new MessageEmbed()
        .setDescription(
          `<@${authorId}> has leveled up! **(${level - 1} → ${level})**`
        )
        .setImage("attachment://level_up.png")
        .setColor(msgColors.PRIMARY as ColorResolvable)
    ],
    files: [await renderLevelUpBoard(authorId, avatarId, level)]
  }
}

async function renderLevelUpBoard(
  authorId: string,
  avatarId: string,
  level: number
) {
  const width = 340
  const height = 100
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  const levelUpBg = await loadImage("src/assets/level_up_bg.png")
  ctx.drawImage(
    levelUpBg,
    0,
    0,
    width,
    (width * levelUpBg.height) / levelUpBg.width
  )

  await renderGradientBackground(
    ctx,
    width,
    height,
    hexToRgba(msgColors.PRIMARY as string, 0),
    msgColors.PRIMARY as string
  )
  await drawHexagon(ctx, 60, 50)
  await writeText(ctx, `${level}`, 60, 58, "22px Dela Gothic One")
  await writeText(ctx, `level up!`, 150, 60, "22px Dela Gothic One")
  const sparkleIcon = await loadImage("src/assets/sparkle.png")
  ctx.drawImage(sparkleIcon, 16, 57, 6, 6)
  ctx.drawImage(sparkleIcon, 18, 60, 9, 9)
  ctx.drawImage(sparkleIcon, 77, 75, 12, 12)
  ctx.drawImage(sparkleIcon, 74, 12, 12, 12)

  if (avatarId && avatarId != "") {
    await drawUserAvatar(
      ctx,
      `https://cdn.discordapp.com/avatars/${authorId}/${avatarId}.png`,
      240,
      6,
      88
    )
  }
  return new MessageAttachment(canvas.toBuffer(), "level_up.png")
}

function renderGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fromColor: string,
  toColor: string
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, fromColor)
  gradient.addColorStop(1, toColor)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color = "white"
) {
  strokeRoundedPath(ctx, cx, cy, hexagon, 3, color, 5, 7 / 20)
}

interface Point {
  x: number
  y: number
}

// const hexagon = [
// 	{x: 100, y: 0},
//   {x: 200, y:50},
//   {x: 200, y:150},
//   {x: 100, y:200},
//   {x: 100, y:200},
//   {x: 1, y:150},
//   {x: 1, y:50},
// ]

const hexagon = [
  { x: 0, y: 100 },
  { x: 86.60254037844386, y: 50.000000000000014 },
  { x: 86.60254037844388, y: -49.99999999999998 },
  { x: 1.2246467991473532e-14, y: -100 },
  { x: -86.60254037844385, y: -50.00000000000004 },
  { x: -86.6025403784439, y: 49.999999999999936 }
]

function strokeRoundedPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  path: Point[],
  radius: number,
  style: string,
  width: number,
  ratio = 1
) {
  ctx.setTransform(1, 0, 0, 1, cx, cy)
  let i = 0
  const len = path.length
  let p1 = path[i++],
    p2 = path[i]
  ctx.lineWidth = width
  ctx.lineCap = "round"
  ctx.strokeStyle = style

  ctx.beginPath()

  ctx.lineTo(((p1.x + p2.x) / 2) * ratio, ((p1.y + p2.y) / 2) * ratio)
  while (i <= len) {
    p1 = p2
    p2 = path[++i % len]
    ctx.arcTo(
      p1.x * ratio,
      p1.y * ratio,
      ((p1.x + p2.x) / 2) * ratio,
      ((p1.y + p2.y) / 2) * ratio,
      radius
    )
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function writeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  font = "30px Arial",
  color = "white"
) {
  ctx.textAlign = "center"
  ctx.font = font
  ctx.fillStyle = color
  ctx.fillText(text, cx, cy)
}

async function drawUserAvatar(
  ctx: CanvasRenderingContext2D,
  url: string,
  cx: number,
  cy: number,
  width: number
) {
  const radius = 10
  ctx.beginPath()
  ctx.moveTo(cx + radius, cy)
  ctx.lineTo(cx + width - radius, cy)
  ctx.quadraticCurveTo(cx + width, cy, cx + width, cy + radius)
  ctx.lineTo(cx + width, cy + width - radius)
  ctx.quadraticCurveTo(cx + width, cy + width, cx + width - radius, cy + width)
  ctx.lineTo(cx + radius, cy + width)
  ctx.quadraticCurveTo(cx, cy + width, cx, cy + width - radius)
  ctx.lineTo(cx, cy + radius)
  ctx.quadraticCurveTo(cx, cy, cx + radius, cy)
  ctx.closePath()
  ctx.clip()
  const img = await loadImage(url)
  ctx.drawImage(img, cx, cy, width, width)
}

function hexToRgba(hex: string, opacity = 1): string {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    throw new Error("Bad Hex")
  }
  let c = hex.substring(1)
  if (c.length == 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  }

  const r = parseInt(c.substring(0, 2), 16),
    g = parseInt(c.substring(2, 4), 16),
    b = parseInt(c.substring(4, 6), 16)

  return `rgba(${r},${g},${b},${opacity})`
}
