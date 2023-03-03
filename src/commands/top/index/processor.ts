import community from "adapters/community"
import { createCanvas, loadImage } from "canvas"
import {
  CommandInteraction,
  Guild,
  GuildMember,
  Message,
  MessageAttachment,
} from "discord.js"
import { APIError } from "errors"
import { RectangleStats } from "types/canvas"
import { LeaderboardItem } from "types/community"
import { heightOf, widthOf } from "ui/canvas/calculator"
import { drawDivider, drawRectangle } from "ui/canvas/draw"
import { getPaginationRow } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"

export async function renderLeaderboard(
  guild: Guild | null,
  leaderboard: LeaderboardItem[]
) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 870,
    },
    y: {
      from: 0,
      to: 670,
    },
    w: 0,
    h: 0,
    pt: 50,
    pl: 30,
    radius: 30,
    bgColor: "rgba(0, 0, 0, 0)", // transparent
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()

  // divider
  drawDivider(
    ctx,
    container.x.from + (container.pl ?? 0),
    container.x.to - (container.pl ?? 0),
    0
  )

  // user title
  ctx.font = "bold 33px Manrope"
  ctx.fillStyle = "white"
  const userTitleStr = "Users"
  const userTitle = {
    x: container.x.from + (container.pl ?? 0),
    y: container.pt ?? 0,
    mb: 20,
  }
  ctx.fillText(userTitleStr, userTitle.x, userTitle.y)

  // level title
  const lvlTitleStr = "Level (XP)"
  const lvlTitle = {
    x: 650,
    y: userTitle.y,
  }
  ctx.fillText(lvlTitleStr, lvlTitle.x, lvlTitle.y)

  // users
  const badgeIcon = {
    w: 30,
    h: 40,
    mr: 30,
  }
  const energyIcon = {
    image: await loadImage(getEmojiURL(emojis.ENERGY)),
    x: lvlTitle.x,
    y: lvlTitle.y,
    w: 20,
    h: 23,
  }
  const line = {
    x: userTitle.x,
    y: userTitle.y + userTitle.mb,
    h: 40,
    mb: 20,
  }
  const username = {
    x: line.x + badgeIcon.w + badgeIcon.mr,
    y: line.y,
    mr: 10,
  }
  ctx.font = "27px Manrope"
  for (const item of leaderboard) {
    const member: GuildMember | undefined = await guild?.members
      .fetch(item.user_id)
      .catch(() => undefined)
    const usernameStr = member?.user?.username ?? item.user?.username
    username.y +=
      heightOf(ctx, usernameStr) +
      (badgeIcon.h - heightOf(ctx, usernameStr)) / 2
    switch (item.guild_rank) {
      case 1:
      case 2:
      case 3: {
        // icon
        const badgeImg = await loadImage(
          getEmojiURL(emojis[`BADGE${item.guild_rank}`])
        )
        ctx.drawImage(badgeImg, line.x, line.y, badgeIcon.w, badgeIcon.h)
        break
      }
      default: {
        const rankStr = `${
          item.guild_rank < 10 ? `0${item.guild_rank}.` : `${item.guild_rank}.`
        }`
        ctx.fillStyle = "#898A8C"
        ctx.fillText(rankStr, line.x, username.y)
        break
      }
    }
    // username
    ctx.font = "bold 27px Manrope"
    ctx.fillStyle = "white"
    // username.y = line.y
    ctx.fillText(usernameStr, username.x, username.y)

    // discriminator
    const discriminator = {
      x: username.x + widthOf(ctx, usernameStr) + username.mr,
      y: username.y,
      mr: 20,
    }
    ctx.font = "27px Manrope"
    ctx.fillStyle = "#888888"
    ctx.fillText(
      `#${member?.user?.discriminator}`,
      discriminator.x,
      discriminator.y
    )

    // level
    const levelStr = `${item.level} `
    ctx.font = "bold 27px Manrope"
    ctx.fillStyle = "#BFBFBF"
    const level = {
      x: lvlTitle.x,
      y: discriminator.y,
      w: widthOf(ctx, levelStr),
    }
    ctx.fillText(levelStr, level.x, level.y)

    // open parentheses
    const openParenthesesStr = "( "
    ctx.font = "27px Manrope"
    ctx.fillText(openParenthesesStr, level.x + level.w, level.y)

    // energy icon
    energyIcon.x = level.x + level.w + widthOf(ctx, openParenthesesStr)
    energyIcon.y = level.y - energyIcon.h + 2
    ctx.drawImage(
      energyIcon.image,
      energyIcon.x,
      energyIcon.y,
      energyIcon.w,
      energyIcon.h
    )

    // current guild xp
    const xpStr = ` ${item.total_xp})`
    const xp = {
      x: energyIcon.x + energyIcon.w,
      y: level.y,
    }
    ctx.fillText(xpStr, xp.x, xp.y)
    line.y += line.h + line.mb
    username.y = line.y
  }

  return new MessageAttachment(canvas.toBuffer(), "leaderboard.png")
}

export async function composeTopEmbed(
  msg: Message | CommandInteraction | undefined,
  pageIdx: number
) {
  const authorId = msg instanceof Message ? msg.author.id : msg?.user.id ?? ""
  const res = await community.getTopXPUsers(
    msg?.guildId || "",
    authorId,
    pageIdx,
    10
  )
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
    })
  }

  const totalPage = Math.ceil(
    (res.data.metadata?.total || 0) / (res.data.metadata?.size || 1)
  )
  const { author, leaderboard } = res.data
  const blank = getEmoji("blank")
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("cup")} ${msg?.guild?.name}'s Web3 rankings`,
    thumbnail: msg?.guild?.iconURL(),
    description: `${blank}**Your rank:** #${
      author.guild_rank
    }\n${blank}**XP:** ${author.total_xp}\n${getEmoji(
      "POINTINGRIGHT"
    )} Move to another page with \`$top [page number]\`\n\u200B`,
    image: "attachment://leaderboard.png",
    color: msgColors.PINK,
  })
  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(res.data.metadata?.page || 0, totalPage),
      files: [await renderLeaderboard(msg?.guild ?? null, leaderboard)],
    },
  }
}
