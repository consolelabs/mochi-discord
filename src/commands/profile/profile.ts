import profile from "adapters/profile"
import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { UserProfile, UserXps } from "types/profile"
import { composeEmbedMessage } from "utils/discordEmbed"
import * as Canvas from "canvas"
import { getHeader } from "utils/common"
import {
  drawAvatar,
  drawProgressBar,
  getHighestRoleColor,
  heightOf,
  widthOf,
} from "utils/canvas"
import { drawRectangle } from "utils/canvas"
import { CircleleStats, RectangleStats, TextStats } from "types/canvas"
import { PREFIX } from "utils/constants"

const fractionXpTitles: Record<string, string> = {
  NOBILITY_XP: "Imperio",
  FAME_XP: "Rebellio",
  LOYALTY_XP: "Mercanto",
  REPUTATION_XP: "Academia",
}

const fractionXpColors: Record<string, string> = {
  NOBILITY_XP: "#ffd437",
  FAME_XP: "#ee3fff",
  LOYALTY_XP: "#a3ff2a",
  REPUTATION_XP: "#01ffed",
}

async function drawFractionProgressBar(
  ctx: Canvas.CanvasRenderingContext2D,
  container: RectangleStats,
  rootComponent: TextStats,
  xps: UserXps
) {
  const fXpTitle = {
    x: rootComponent.x,
    y: rootComponent.y + rootComponent.mb,
    mb: 20,
  }
  const fractionPgBar: RectangleStats = {
    x: {
      from: fXpTitle.x,
      to: 0,
    },
    y: {
      from: fXpTitle.y + fXpTitle.mb,
      to: 0,
    },
    w: 0,
    h: 40,
    radius: 10,
    overlayColor: "white",
    mb: 10,
    mr: 50,
  }
  fractionPgBar.w = (container.w - fractionPgBar.mr - container.pl * 2) / 2
  const fXpProgress = {
    x: fractionPgBar.x.from,
    y: 0,
    mb: 60,
  }
  Object.entries(xps).forEach(([k, xp], i) => {
    // title
    ctx.font = "bold 35px Manrope"
    const fXpTitleStr = `${fractionXpTitles[k.toUpperCase()]}`
    ctx.fillText(fXpTitleStr, fXpTitle.x, fXpTitle.y)

    // pg bar
    const baseXp = Math.floor(xp / 1000) * 1000
    let targetXp = Math.max(Math.ceil(xp / 1000) * 1000, 1000)
    targetXp += targetXp === baseXp ? 1000 : 0
    const fractionPg = (xp - baseXp) / (targetXp - baseXp)

    fractionPgBar.overlayColor = fractionXpColors[k.toUpperCase()]
    fractionPgBar.x.to = fractionPgBar.x.from + fractionPgBar.w
    fractionPgBar.y.to = fractionPgBar.y.from + fractionPgBar.h
    drawProgressBar(ctx, fractionPgBar, fractionPg)

    // progress
    ctx.font = "32px Manrope"
    const fXpProgressStr = `${xp} / ${targetXp}`
    fXpProgress.y =
      fractionPgBar.y.to + fractionPgBar.mb + heightOf(ctx, fXpProgressStr)
    ctx.fillText(fXpProgressStr, fXpProgress.x, fXpProgress.y)

    if (i % 2 === 0) {
      // stats for right components
      fXpTitle.x = fractionPgBar.x.to + fractionPgBar.mr
      fractionPgBar.x = {
        from: fXpTitle.x,
        to: fXpTitle.x + fractionPgBar.w,
      }
      fXpProgress.x = fXpTitle.x
      return
    }

    // stats for left components
    fXpTitle.x = rootComponent.x
    fractionPgBar.x = {
      from: fXpTitle.x,
      to: fXpTitle.x + fractionPgBar.w,
    }
    fXpProgress.x = fXpTitle.x
    fXpTitle.y = fXpProgress.y + fXpProgress.mb
    fractionPgBar.y.from = fXpTitle.y + fXpTitle.mb
    fractionPgBar.y.to = fractionPgBar.y.from + fractionPgBar.h
    fXpProgress.y =
      fractionPgBar.y.to + fractionPgBar.mb + heightOf(ctx, fXpProgressStr)
  })
}

async function renderProfile(msg: Message, data: UserProfile) {
  let withFractionXp = data.guild?.global_xp
  let ptProfile
  if (data.guild?.global_xp) {
    ptProfile = await profile.getPodTownUser(msg.author.id)
  }
  withFractionXp = withFractionXp && !!ptProfile && ptProfile.is_verified

  const container = {
    x: {
      from: 0,
      to: withFractionXp ? 950 : 900,
    },
    y: {
      from: 0,
      to: withFractionXp ? 830 : 550,
    },
    w: 0,
    h: 0,
    pl: 40,
    pt: 45,
    bgColor: "#303137",
    radius: 30,
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = Canvas.createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")

  // background
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()
  ctx.fillStyle = container.bgColor
  // ctx.fillRect(0, 0, container.w, container.h)
  const background = await Canvas.loadImage("src/assets/profile_bg.jpg")
  ctx.globalAlpha = 0.1
  ctx.drawImage(background, 0, 0, container.w, container.h)
  ctx.restore()

  // avatar
  const avatar: CircleleStats = {
    x: container.pl,
    y: container.pt,
    radius: 75,
    mr: 40,
    mb: 65,
    outlineColor: getHighestRoleColor(msg.member),
  }
  avatar.x += avatar.radius
  avatar.y += avatar.radius
  await drawAvatar(ctx, avatar, msg.author)

  // username
  ctx.fillStyle = getHighestRoleColor(msg.member)
  ctx.font = "bold 39px Manrope"
  const username = {
    w: widthOf(ctx, msg.author.username),
    h: heightOf(ctx, msg.author.username),
    x: container.pl + avatar.radius * 2 + avatar.mr,
    y: container.pt + heightOf(ctx, msg.author.username),
    mb: 15,
    mr: 15,
  }
  ctx.fillText(msg.author.username, username.x, username.y)

  // discriminator
  ctx.save()
  ctx.fillStyle = "white"
  const discriminator = {
    x: username.x + username.w + username.mr,
    y: username.y,
  }
  ctx.fillStyle = "#dcdfe3"
  ctx.fillText(`#${msg.author.discriminator}`, discriminator.x, discriminator.y)
  ctx.restore()

  // level
  ctx.save()
  ctx.font = "bold 33px Manrope"
  const lvlStr = `lvl ${data.current_level.level}`
  const lvl = {
    x: container.w - container.pl - widthOf(ctx, lvlStr),
    y: username.y,
  }
  ctx.fillStyle = "white"
  ctx.fillText(lvlStr, lvl.x, lvl.y)
  ctx.restore()

  // XP progress bar
  const pgBar: RectangleStats = {
    x: {
      from: username.x,
      to: container.w - container.pl,
    },
    y: {
      from: username.y + username.mb + username.h,
      to: 0,
    },
    w: 0,
    h: 60,
    radius: 10,
    overlayColor: "white",
    mb: 10,
  }
  pgBar.w = pgBar.x.to - pgBar.x.from
  pgBar.y.to = pgBar.y.from + pgBar.h
  drawProgressBar(ctx, pgBar, data.progress)

  // Local XP
  ctx.fillStyle = "white"
  ctx.font = "bold 32px Manrope"
  const xpTitleStr = "Local XP"
  const xpTitle = {
    x: container.pl,
    y: container.pt + avatar.radius * 2 + avatar.mb + heightOf(ctx, xpTitleStr),
    mr: 70,
    mb: 50,
  }
  ctx.fillText(xpTitleStr, xpTitle.x, xpTitle.y)

  ctx.save()
  const localXpStr = `${data.guild_xp}`
  const localXp = {
    x: xpTitle.x + widthOf(ctx, xpTitleStr) + xpTitle.mr,
    y: xpTitle.y,
    mr: 170,
  }
  ctx.fillText(localXpStr, localXp.x, localXp.y)
  ctx.restore()

  // Server activities
  const actTitleStr = "Activities"
  const actTitle = {
    x: xpTitle.x,
    y: xpTitle.y + xpTitle.mb,
    mb: 90,
  }
  ctx.fillText(actTitleStr, actTitle.x, actTitle.y)

  ctx.save()
  const actStr = `${data.nr_of_actions}`
  const act = {
    x: localXp.x,
    y: actTitle.y,
  }
  ctx.fillText(actStr, act.x, act.y)
  ctx.restore()

  // XP to lvlup
  ctx.save()
  const lvlupStr = `${Math.max(0, data.next_level.min_xp - data.guild_xp)}`
  const lvlup = {
    x: container.w - container.pl - widthOf(ctx, lvlupStr),
    y: localXp.y,
    ml: 70,
  }
  ctx.fillText(lvlupStr, lvlup.x, lvlup.y)
  ctx.restore()

  const lvlupTitleStr = "XP to level up"
  const lvlupTitle = {
    x: lvlup.x - lvlup.ml - widthOf(ctx, lvlupTitleStr),
    y: lvlup.y,
  }
  ctx.fillText(lvlupTitleStr, lvlupTitle.x, lvlupTitle.y)

  // About me
  const aboutMeTitleStr = "About me"
  const aboutMeTitle = {
    x: container.pl,
    y: actTitle.y + actTitle.mb,
    mb: 45,
  }
  ctx.fillText(aboutMeTitleStr, aboutMeTitle.x, aboutMeTitle.y)

  ctx.font = "29px Manrope"
  const aboutMeStr =
    data.about_me.trim().length === 0
      ? "I'm a mysterious person"
      : data.about_me
  const aboutMe = {
    x: aboutMeTitle.x,
    y: aboutMeTitle.y + aboutMeTitle.mb,
    mb: 80,
  }
  ctx.fillText(aboutMeStr, aboutMe.x, aboutMe.y)

  // fraction XPs
  if (withFractionXp) {
    const { xps } = ptProfile
    await drawFractionProgressBar(ctx, container, aboutMe, xps)
  }

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
