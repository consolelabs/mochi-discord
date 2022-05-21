import { Command } from "types/common"
import { Message, MessageAttachment } from "discord.js"
import { DOT, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"
import * as Canvas from "canvas"
import { getCommandArguments } from "utils/commands"

const getFont = (fontSize: number) => `bold ${fontSize}px Manrope`

function adjustFontSize(
  ctx: Canvas.CanvasRenderingContext2D,
  str: string,
  maxWidth: number,
  fontSize: number
) {
  ctx.font = getFont(fontSize)
  // minimum font size - 15
  if (ctx.measureText(str).width >= maxWidth && fontSize >= 15) {
    adjustFontSize(ctx, str, maxWidth, fontSize - 1)
    return
  }
  ctx.font = getFont(fontSize)
}

function setRowTextColor(record: any, ctx: Canvas.CanvasRenderingContext2D) {
  let color
  switch (record.guild_rank) {
    case 1:
      color = "#FEE101"
      break
    case 2:
      color = "#A7A7AD"
      break
    case 3:
      color = "#A77044"
      break
    default:
      color = "white"
      break
  }
  ctx.fillStyle = color
}

async function renderLeaderboard(leaderboard: any[]) {
  const containerWidth = 750
  const containerHeight = 600
  const canvas = Canvas.createCanvas(containerWidth, containerHeight)
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
  ctx.fillRect(0, 0, containerWidth, containerHeight)
  const fontSize = 25
  ctx.font = getFont(fontSize)

  const row = {
    x: 0,
    y: 0,
    paddingLeft: 20,
    paddingTop: 45
  }
  row.y += row.paddingTop
  const rowGap = 35
  const rankMaxWidth = ctx.measureText(
    `#${leaderboard.slice(-1)[0].guild_rank} `
  ).width
  leaderboard.forEach(record => {
    let x = row.x + row.paddingLeft
    const rank = `#${record.guild_rank} `
    const dot = `${DOT}  `
    const username = record.user.username
    const level = `lv.${record.level}`
    const score = `${record.total_xp} pts`

    // rank
    setRowTextColor(record, ctx)
    ctx.fillText(rank, x, row.y)
    x += rankMaxWidth
    // seperator
    ctx.fillText(dot, x, row.y)
    x += ctx.measureText(dot).width
    // username
    const usernameMaxWidth = 400
    adjustFontSize(ctx, username, usernameMaxWidth, fontSize)
    ctx.fillText(username, x, row.y)
    x += usernameMaxWidth
    // level
    ctx.font = getFont(fontSize)
    ctx.fillText(level, x, row.y)
    x += ctx.measureText(level).width + 45
    // XP score
    ctx.fillText(score, x, row.y)

    // next row y coordinate
    const lineHeight =
      ctx.measureText(score).actualBoundingBoxAscent +
      ctx.measureText(score).actualBoundingBoxDescent
    row.y += lineHeight + rowGap
  })

  return new MessageAttachment(canvas.toBuffer(), "leaderboard.png")
}

const command: Command = {
  id: "top",
  command: "top",
  brief: "Show members with the highest server XP score",
  category: "Community",
  run: async function(msg: Message) {
    const args = getCommandArguments(msg)
    let page = args.length > 1 ? +args[1] : 0
    page = Math.max(isNaN(page) ? 0 : page - 1, 0)
    const data = await Community.getTopXPUsers(msg, page)
    if (!data || !data.leaderboard || !data.leaderboard.length)
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: msg.guild.name,
              description: "No ranking data found"
            })
          ]
        }
      }

    const { author, leaderboard } = data
    let description = "**Your rank**\n"
    if (author.guild_rank) {
      description += `You are rank \`#${author.guild_rank}\` on this server\nwith a total of **${author.total_xp} XP score**`
    } else {
      description += "You are `unranked` on this server"
    }
    const embed = composeEmbedMessage(msg, {
      title: `${msg.guild.name}'s all-time rankings`,
      thumbnail: msg.guild.iconURL(),
      description,
      image: "attachment://leaderboard.png"
    })

    return {
      messageOptions: {
        embeds: [embed],
        files: [await renderLeaderboard(leaderboard)]
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}top [page]`,
        examples: `${PREFIX}top\n${PREFIX}top 2`
      })
    ]
  }),
  canRunWithoutAction: true
}

export default command
