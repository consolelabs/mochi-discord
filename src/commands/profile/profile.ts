import profile from "adapters/profile"
import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { UserProfile } from "types/profile"
import { composeEmbedMessage } from "utils/discordEmbed"
import * as Canvas from "canvas"
import { getHeader } from "utils/common"
import { heightOf, widthOf } from "utils/canvas"
import { drawRectangle } from "utils/canvas"
import { RectangleStats } from "types/canvas"
import { PREFIX } from "utils/constants"

function getHighestRoleColor(msg: Message) {
  const { hexColor } = msg.member.roles.highest
  return hexColor === "#000000" ? "white" : hexColor
}

async function drawAvatar(
  msg: Message,
  avatar: any,
  container: any,
  ctx: Canvas.CanvasRenderingContext2D
) {
  const avatarOutlineRadius = avatar.w / 2
  const avatarOuline = {
    x: avatarOutlineRadius + container.pl,
    y: container.pt + avatarOutlineRadius,
  }

  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.arc(avatarOuline.x, avatarOuline.y, avatarOutlineRadius, 0, Math.PI * 2)
  ctx.strokeStyle = getHighestRoleColor(msg)
  ctx.stroke()
  ctx.closePath()
  ctx.clip()

  const avatarURL = msg.author.displayAvatarURL({ format: "jpeg" })
  if (avatarURL) {
    const userAvatar = await Canvas.loadImage(avatarURL)
    ctx.drawImage(userAvatar, container.pl, container.pt, avatar.w, avatar.h)
  }
}

function drawProgressBar(
  pgBar: RectangleStats,
  data: UserProfile,
  ctx: Canvas.CanvasRenderingContext2D
) {
  // pg bar container
  const radius = 10
  drawRectangle(ctx, pgBar, radius, "#4a4b4e")

  // pg bar overlay
  const xpProgress = data.next_level.min_xp
    ? Math.min(
        (data.guild_xp - data.current_level.min_xp) /
          (data.next_level.min_xp - data.current_level.min_xp),
        1
      )
    : 1
  const overlay = pgBar
  overlay.x.to = Math.max(
    overlay.x.from + radius * 2,
    overlay.x.from + overlay.w * xpProgress
  )
  drawRectangle(ctx, overlay, radius, "white")
}

async function renderProfile(msg: Message, data: UserProfile) {
  const container = {
    w: 900,
    h: 550,
    pl: 40,
    pt: 45,
    actualW: 0,
    bgColor: "#303137",
  }
  container.actualW = container.w - container.pl * 2
  const canvas = Canvas.createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = container.bgColor
  ctx.fillRect(0, 0, container.w, container.h)
  ctx.save()

  const avatar = { w: 150, h: 150, mr: 40, mb: 65 }
  await drawAvatar(msg, avatar, container, ctx)
  ctx.restore()

  // username
  ctx.fillStyle = getHighestRoleColor(msg)
  ctx.font = "bold 40px Manrope"
  const username = {
    w: widthOf(ctx, msg.author.username),
    h: heightOf(ctx, msg.author.username),
    x: container.pl + avatar.w + avatar.mr,
    y: container.pt + heightOf(ctx, msg.author.username),
    mb: 15,
    mr: 15,
  }
  ctx.fillText(msg.author.username, username.x, username.y)

  // discriminator
  ctx.fillStyle = "white"
  const discriminator = {
    x: username.x + username.w + username.mr,
    y: username.y,
  }
  // ctx.fillStyle = "#606468"
  ctx.fillText(`#${msg.author.discriminator}`, discriminator.x, discriminator.y)

  // level
  ctx.save()
  ctx.font = "bold 34px Manrope"
  const lvlStr = `lvl ${data.current_level.level}`
  const lvl = {
    x: container.w - container.pl - widthOf(ctx, lvlStr),
    y: username.y,
  }
  ctx.fillStyle = "white"
  ctx.fillText(lvlStr, lvl.x, lvl.y)
  ctx.restore()

  // XP progress bar
  const pgBar = {
    x: {
      from: username.x,
      to: container.w - container.pl,
    },
    y: {
      from: username.y + username.mb + username.h,
      to: 0,
    },
    w: container.w - container.pl - username.x,
    h: 60,
    mb: 10,
  }
  pgBar.y.to = pgBar.y.from + pgBar.h
  drawProgressBar(pgBar, data, ctx)

  // Server XP
  ctx.font = "bold 33px Manrope"
  const xpTitleStr = "Server XP"
  const xpTitle = {
    x: container.pl,
    y: container.pt + avatar.h + avatar.mb + heightOf(ctx, xpTitleStr),
    mr: 70,
    mb: 50,
  }
  ctx.fillText(xpTitleStr, xpTitle.x, xpTitle.y)

  const xpStr = `${data.guild_xp}`
  const xp = {
    x: xpTitle.x + widthOf(ctx, xpTitleStr) + xpTitle.mr,
    y: xpTitle.y,
    mr: 170,
  }
  ctx.fillText(xpStr, xp.x, xp.y)

  // Server activities
  const actTitleStr = "Activities"
  const actTitle = {
    x: xpTitle.x,
    y: xpTitle.y + xpTitle.mb,
    mb: 90,
  }
  ctx.fillText(actTitleStr, actTitle.x, actTitle.y)

  const actStr = `${data.nr_of_actions}`
  const act = {
    x: xp.x,
    y: actTitle.y,
  }
  ctx.fillText(actStr, act.x, act.y)

  // XP to lvlup
  const lvlupTitleStr = "XP to level up"
  const lvlupTitle = {
    x: xp.x + widthOf(ctx, xpStr) + xp.mr,
    y: xp.y,
    mr: 70,
    mb: 50,
  }
  ctx.fillText(lvlupTitleStr, lvlupTitle.x, lvlupTitle.y)

  const lvlupStr = `${Math.max(0, data.next_level.min_xp - data.guild_xp)}`
  const lvlup = {
    x: lvlupTitle.x + widthOf(ctx, lvlupTitleStr) + lvlupTitle.mr,
    y: lvlupTitle.y,
  }
  ctx.fillText(lvlupStr, lvlup.x, lvlup.y)

  // About me
  const aboutMeTitleStr = "About me"
  const aboutMeTitle = {
    x: container.pl,
    y: actTitle.y + actTitle.mb,
    mb: 45,
  }
  ctx.fillText(aboutMeTitleStr, aboutMeTitle.x, aboutMeTitle.y)

  ctx.font = "30px Manrope"
  const aboutMeStr =
    data.about_me.trim().length === 0
      ? "I'm a mysterious person"
      : data.about_me
  const aboutMe = {
    x: aboutMeTitle.x,
    y: aboutMeTitle.y + aboutMeTitle.mb,
  }
  ctx.fillText(aboutMeStr, aboutMe.x, aboutMe.y)

  return new MessageAttachment(canvas.toBuffer(), "profile.png")
}

const command: Command = {
  id: "profile",
  command: "profile",
  brief: "Check your server profile",
  category: "Profile",
  run: async (msg) => {
    const data = await profile.getUserProfile(msg.guildId, msg.author.id)
    return {
      messageOptions: {
        content: getHeader("Viewing profile", msg.author),
        files: [await renderProfile(msg, data)],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}profile`,
          usage: `${PREFIX}profile`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
