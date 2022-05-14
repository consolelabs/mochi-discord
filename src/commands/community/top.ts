import { Command } from "types/common"
import { Message, MessageAttachment } from "discord.js"
import { DOT, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"
import * as Canvas from "canvas"
import { getCommandArguments } from "utils/commands"

async function renderLeaderboard(leaderboard: any[]) {
  const canvas = Canvas.createCanvas(650, 600)
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
  ctx.fillRect(0, 0, 650, 600)

  ctx.fillStyle = "white"
  ctx.font = "bold 25px Manrope"
  const row = {
    x: 40,
    y: 50
  }
  let { x, y } = row
  for (const record of leaderboard) {
    let { username } = record.user
    username = username.length > 15 ? `${username.slice(0, 15)}...` : username
    const userRank = `#${record.guild_rank} ${DOT} ${username}`
    ctx.fillText(userRank, x, y)
    x += 360
    ctx.fillText(`lv.${record.level}`, x, y)
    x += ctx.measureText(record.level).width + 80
    ctx.fillText(`${record.total_xp} pts`, x, y)
    x = row.x
    y +=
      ctx.measureText(record.total_xp).actualBoundingBoxAscent +
      ctx.measureText(record.total_xp).actualBoundingBoxDescent +
      40
  }
  return new MessageAttachment(canvas.toBuffer(), "leaderboard.png")
}

const command: Command = {
  id: "top",
  command: "top",
  brief: "All-time Rankings",
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
        usage: `${PREFIX}top`,
        examples: `${PREFIX}top`
      })
    ]
  }),
  canRunWithoutAction: true
}

export default command
