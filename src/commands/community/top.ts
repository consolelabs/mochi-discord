import { Command } from "types/common"
import { GuildMember, Message, MessageAttachment } from "discord.js"
import { DOT, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"
import * as Canvas from "canvas"
import { getCommandArguments } from "utils/commands"
import {
  drawAvatar,
  drawProgressBar,
  drawRectangle,
  heightOf,
  widthOf,
} from "utils/canvas"
import { LeaderboardItem } from "types/community"
import { CircleleStats, RectangleStats } from "types/canvas"

async function renderLeaderboard(msg: Message, leaderboard: LeaderboardItem[]) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 700,
    },
    y: {
      from: 0,
      to: 600,
    },
    w: 0,
    h: 0,
    pt: 10,
    pl: 30,
    radius: 30,
    bgColor: "rgba(0, 0, 0, 0.2)",
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = Canvas.createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()

  const background = await Canvas.loadImage("src/assets/leaderboard_bg.png")
  ctx.globalAlpha = 0.2
  ctx.drawImage(background, 0, 0, container.w, container.h)
  ctx.restore()

  const row = {
    ...container,
    pt: 15,
    h: 110,
  }
  row.y.from += container.pt
  row.y.to = row.h + row.y.from

  for (const item of leaderboard) {
    // avatar
    const avatar: CircleleStats = { radius: 40, mr: 40, x: 0, y: 0 }
    avatar.x = row.x.from + row.pl + avatar.radius
    avatar.y = row.y.from + row.pt + avatar.radius
    const member: GuildMember | undefined = await msg.guild.members
      .fetch(item.user_id)
      .catch(() => undefined)
    if (member) await drawAvatar(ctx, avatar, member.user)

    // username
    Canvas.registerFont("src/assets/Montserrat.ttf", {
      family: "Montserrat",
    })
    ctx.font = "30px Montserrat"
    ctx.fillStyle = "white"
    const userRankStr = `#${item.guild_rank} ${DOT} ${
      member?.user.username ?? item.user.username
    }`
    const userRank = {
      x: avatar.x + avatar.radius + avatar.mr,
      y: avatar.y - 10,
      mb: 12,
    }
    ctx.fillText(userRankStr, userRank.x, userRank.y)

    // Level
    const lvlStr = "LVL"
    ctx.save()
    ctx.font = "35px Montserrat"
    const lvlValueStr = `${item.level}`
    const lvlValue = {
      x:
        container.x.to -
        container.pl -
        Math.max(widthOf(ctx, lvlValueStr), widthOf(ctx, lvlStr)),
      y: avatar.y,
      mb: 15,
      ml: 20,
    }
    ctx.fillText(lvlValueStr, lvlValue.x, lvlValue.y)
    ctx.restore()

    // LVL
    ctx.save()
    ctx.font = "23px fantasy"
    const lvl = {
      x: lvlValue.x,
      y: lvlValue.y + lvlValue.mb + heightOf(ctx, lvlStr),
    }
    ctx.fillText(lvlStr, lvl.x, lvl.y)
    ctx.restore()

    // progress bar
    const pgBar: RectangleStats = {
      x: {
        from: userRank.x,
        to: lvlValue.x - lvlValue.ml,
      },
      y: {
        from: userRank.y + userRank.mb,
        to: 0,
      },
      w: 0,
      h: 10,
      radius: 5,
      overlayColor: "#4DFFD8",
      mb: 9,
    }
    pgBar.w = pgBar.x.to - pgBar.x.from
    pgBar.y.to = pgBar.y.from + pgBar.h
    drawProgressBar(ctx, pgBar, item.progress)

    // local xp
    ctx.font = "24px serif"
    const xpStr = `${item.total_xp}`
    const xp = {
      x: pgBar.x.from,
      y: pgBar.y.to + heightOf(ctx, xpStr) + pgBar.mb,
    }
    ctx.fillText(xpStr, xp.x, xp.y)

    // next row
    row.y.from = row.y.to
    row.y.to = row.y.from + row.h
  }

  return new MessageAttachment(canvas.toBuffer(), "leaderboard.png")
}

const command: Command = {
  id: "top",
  command: "top",
  brief: "Show members with the highest server XP score",
  category: "Community",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    let page = args.length > 1 ? +args[1] : 0
    page = Math.max(isNaN(page) ? 0 : page - 1, 0)
    const data = await Community.getTopXPUsers(msg, page, 5)
    if (!data || !data.leaderboard || !data.leaderboard.length)
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: msg.guild.name,
              description: "No ranking data found",
            }),
          ],
        },
      }

    const { author, leaderboard } = data
    let description = "**Your rank**\n"
    description += author.guild_rank
      ? `You are rank \`#${author.guild_rank}\` on this server\nwith a total of **${author.total_xp} XP score**`
      : "You are `unranked` on this server"

    const embed = composeEmbedMessage(msg, {
      title: `${msg.guild.name}'s all-time rankings`,
      thumbnail: msg.guild.iconURL(),
      description,
      image: "attachment://leaderboard.png",
    })

    return {
      messageOptions: {
        embeds: [embed],
        files: [await renderLeaderboard(msg, leaderboard)],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}top [page]`,
        examples: `${PREFIX}top\n${PREFIX}top 2`,
      }),
    ],
  }),
  canRunWithoutAction: true,
}

export default command
