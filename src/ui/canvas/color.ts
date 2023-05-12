import { createCanvas } from "canvas"
import { GuildMember } from "discord.js"

export function getChartColorConfig(id?: string) {
  let gradientFrom, gradientTo, borderColor
  switch (id) {
    case "bitcoin":
    case "btc.d":
      borderColor = "#ffa301"
      gradientFrom = "rgba(159,110,43,0.9)"
      gradientTo = "rgba(76,66,52,0.5)"
      break
    case "ethereum":
    case "ethereum-pow-iou":
      borderColor = "#a996f2"
      gradientFrom = "rgba(108,136,217,0.9)"
      gradientTo = "rgba(74,93,148,0.5)"
      break
    case "tether":
      borderColor = "#22a07a"
      gradientFrom = "rgba(46,78,71,0.9)"
      gradientTo = "rgba(48,63,63,0.5)"
      break
    case "binancecoin" || "terra":
      borderColor = "#f5bc00"
      gradientFrom = "rgba(172,136,41,0.9)"
      gradientTo = "rgba(73,67,55,0.5)"
      break
    case "solana":
      borderColor = "#9945ff"
      gradientFrom = "rgba(116,62,184,0.9)"
      gradientTo = "rgba(61,53,83,0.5)"
      break
    default:
      borderColor = "#009cdb"
      gradientFrom = "rgba(53,83,192,0.9)"
      gradientTo = "rgba(58,69,110,0.5)"
  }

  return {
    borderColor,
    backgroundColor: getGradientColor(gradientFrom, gradientTo),
  }
}

export function getHighestRoleColor(member: GuildMember) {
  const { hexColor } = member.roles.highest
  return hexColor === "#000000" ? "white" : hexColor
}

export function getGradientColor(
  fromColor: string,
  toColor: string
): CanvasGradient {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const backgroundColor = ctx.createLinearGradient(0, 0, 0, 400)
  backgroundColor.addColorStop(0, fromColor)
  backgroundColor.addColorStop(1, toColor)
  return backgroundColor
}
