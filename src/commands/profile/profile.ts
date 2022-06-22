import profile from "adapters/profile"
import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { UserProfile, UserXps } from "types/profile"
import { composeEmbedMessage } from "utils/discordEmbed"
import * as Canvas from "canvas"
import {
  drawAvatar,
  drawProgressBar,
  heightOf,
  widthOf,
  fillWrappedText,
  calculateWrapperTextHeight,
  drawDivider,
} from "utils/canvas"
import { drawRectangle } from "utils/canvas"
import { CircleleStats, RectangleStats, TextStats } from "types/canvas"
import { PREFIX } from "utils/constants"
import { emojis, getEmojiURL, msgColors } from "utils/common"

const fractionXpTitles: Record<string, string> = {
  NOBILITY_XP: "Imperio",
  FAME_XP: "Rebellio",
  LOYALTY_XP: "Mercanto",
  REPUTATION_XP: "Academia",
}

const fractionXpColors: Record<string, string> = {
  NOBILITY_XP: "#EDDEA7",
  FAME_XP: "#EFB88B",
  LOYALTY_XP: "#9EFFE8",
  REPUTATION_XP: "#C2E6FF",
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
    ctx.font = "bold 34px Manrope"
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
    ctx.font = "31px Manrope"
    const fXpProgressStr = `${xp} / ${targetXp}`
    fXpProgress.x = fractionPgBar.x.to - widthOf(ctx, fXpProgressStr)
    fXpProgress.y = fXpTitle.y
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
    fXpTitle.y = fractionPgBar.y.to + fXpProgress.mb
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
      to: withFractionXp ? 1200 : 900,
    },
    y: {
      from: 0,
      to: withFractionXp ? 900 : 620,
    },
    w: 0,
    h: 0,
    pl: 40,
    pt: 45,
    // bgColor: "#303137",
    bgColor: "#2F3136",
    radius: 30,
  }
  container.w = container.x.to - container.x.from
  // add container if long aboutme
  const aboutMeStr =
    data.about_me.trim().length === 0
      ? "I'm a mysterious person"
      : data.about_me
  const oneLineHeight = calculateWrapperTextHeight(
    "Sample text",
    "33px Manrope",
    container.w - container.pl * 2
  )
  const aboutmeHeight = calculateWrapperTextHeight(
    aboutMeStr,
    "33px Manrope",
    container.w - container.pl * 2
  )
  const additionalHeight = Math.max(aboutmeHeight - oneLineHeight, 0)
  container.y.to += additionalHeight
  container.h = container.y.to - container.y.from
  const canvas = Canvas.createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")

  // background
  ctx.save()
  drawRectangle(ctx, container, container.bgColor)
  ctx.clip()
  ctx.restore()

  // avatar
  const avatar: CircleleStats = {
    x: container.pl,
    y: container.pt,
    radius: 82,
    mr: 40,
    mb: 50,
  }
  avatar.x += avatar.radius
  avatar.y += avatar.radius
  await drawAvatar(ctx, avatar, msg.author)

  // username
  ctx.fillStyle = "white"
  ctx.font = "bold 39px Manrope"
  const username = {
    w: widthOf(ctx, msg.author.username),
    h: heightOf(ctx, msg.author.username),
    x: container.pl + avatar.radius * 2 + avatar.mr,
    y: container.pt + heightOf(ctx, msg.author.username),
    mb: 25,
    mr: 15,
  }
  ctx.fillText(msg.author.username, username.x, username.y)

  // discriminator
  ctx.save()
  ctx.font = "30px Manrope"
  ctx.fillStyle = "#8B8B8B"
  const discriminator = {
    x: username.x + username.w + username.mr,
    y: username.y,
  }
  ctx.fillStyle = "#dcdfe3"
  ctx.fillText(`#${msg.author.discriminator}`, discriminator.x, discriminator.y)
  ctx.restore()

  // rank title
  ctx.save()
  ctx.font = "bold 33px Manrope"
  const rankTitleStr = "Rank:  "
  const rankStr = `#${
    data.guild_rank < 10 ? `0${data.guild_rank}` : `${data.guild_rank}`
  }`
  const rankTitle = {
    x: container.w - container.pl - widthOf(ctx, `${rankTitleStr}${rankStr}`),
    y: username.y,
  }
  ctx.fillStyle = "white"
  ctx.fillText(rankTitleStr, rankTitle.x, rankTitle.y)

  // rank
  ctx.font = "33px Manrope"
  const rank = {
    x: rankTitle.x + widthOf(ctx, rankTitleStr),
    y: username.y,
  }
  ctx.fillStyle = "#bfbfbf"
  ctx.fillText(rankStr, rank.x, rank.y)
  ctx.restore()

  // divider
  const divider = {
    x: {
      from: username.x,
      to: container.w - container.pl,
    },
    y: username.y + username.mb,
    mb: 25,
  }
  drawDivider(ctx, divider.x.from, divider.x.to, divider.y)

  // level
  ctx.font = "bold 33px Manrope"
  const lvlStr = `Level ${data.current_level.level}`
  const lvl = {
    x: username.x,
    y: divider.y + divider.mb + heightOf(ctx, lvlStr),
    mb: 15,
  }
  ctx.fillStyle = "white"
  ctx.fillText(lvlStr, lvl.x, lvl.y)

  // XP
  const xpStr = `${data.guild_xp}/${
    data.next_level.min_xp ? data.next_level.min_xp : data.current_level.min_xp
  }`
  const xp = {
    x: container.w - container.pl - widthOf(ctx, `${xpStr}`),
    y: lvl.y,
    ml: 30,
  }
  ctx.font = "33px Manrope"
  ctx.fillStyle = "#BFBFBF"
  ctx.fillText(xpStr, xp.x, xp.y)

  // XP Title
  const xpTitleStr = "XP:  "
  const xpIcon = {
    image: await Canvas.loadImage(getEmojiURL(emojis.ENERGY)),
    h: 35,
    w: 25,
    x: xp.x - xp.ml,
    y: xp.y - heightOf(ctx, xpTitleStr) - 5,
  }
  ctx.drawImage(xpIcon.image, xpIcon.x, xpIcon.y, xpIcon.w, xpIcon.h)
  const xpTitle = {
    x: xp.x - xp.ml - widthOf(ctx, xpTitleStr),
    y: lvl.y,
  }
  ctx.fillStyle = "white"
  ctx.font = "bold 33px Manrope"
  ctx.fillText(xpTitleStr, xpTitle.x, xpTitle.y)

  // XP progress bar
  const pgBar: RectangleStats = {
    x: {
      from: username.x,
      to: container.w - container.pl,
    },
    y: {
      from: lvl.y + lvl.mb,
      to: 0,
    },
    w: 0,
    h: 40,
    radius: 10,
    overlayColor: msgColors.PRIMARY.toString(),
    mb: 10,
  }
  pgBar.w = pgBar.x.to - pgBar.x.from
  pgBar.y.to = pgBar.y.from + pgBar.h
  drawProgressBar(ctx, pgBar, data.progress)

  // aboutme title
  const aboutMeTitleStr = "About me"
  const aboutMeTitle = {
    x: container.pl,
    // y: actTitle.y + actTitle.mb,
    y:
      container.pt +
      avatar.radius * 2 +
      avatar.mb +
      heightOf(ctx, aboutMeTitleStr),
    mb: 45,
  }
  ctx.fillText(aboutMeTitleStr, aboutMeTitle.x, aboutMeTitle.y)

  // aboutme
  ctx.save()
  ctx.font = "33px Manrope"
  const aboutMe = {
    x: aboutMeTitle.x,
    y: aboutMeTitle.y + aboutMeTitle.mb,
    mb: 80,
  }
  // last line y-coordinate
  aboutMe.y = fillWrappedText(
    ctx,
    aboutMeStr,
    aboutMe.x,
    aboutMe.y,
    container.w - container.pl * 2
  )
  ctx.restore()

  // Address title
  const addressTitleStr = "Address"
  const addressTitle = {
    x: aboutMeTitle.x,
    y: aboutMe.y + aboutMe.mb,
    mb: 45,
  }
  ctx.fillText(addressTitleStr, addressTitle.x, addressTitle.y)

  // wallet address
  ctx.save()
  ctx.fillStyle = "#0DB4FB"
  ctx.font = "33px Manrope"
  let addressStr = data.user_wallet?.address
  if (!addressStr || !addressStr.length) {
    ctx.fillStyle = "#BFBFBF"
    addressStr = "N/A"
  }
  const address = {
    x: addressTitle.x,
    y: addressTitle.y + addressTitle.mb,
    mb: 80,
  }
  ctx.fillText(addressStr, address.x, address.y)
  ctx.restore()

  // role title
  const roleTitleStr = "Role"
  const roleTitle = {
    x: address.x,
    y: address.y + address.mb,
    mb: 45,
  }
  ctx.fillText(roleTitleStr, roleTitle.x, roleTitle.y)

  // role
  ctx.save()
  const highestRole =
    msg.member.roles.highest.name !== "@everyone"
      ? msg.member.roles.highest
      : null
  ctx.fillStyle = highestRole?.hexColor ?? "white"
  const roleStr = highestRole?.name ?? "N/A"
  const role = {
    x: roleTitle.x,
    y: roleTitle.y + roleTitle.mb,
    mb: 80,
  }
  ctx.fillText(roleStr, role.x, role.y)
  ctx.restore()

  // activity title
  const activityTitleStr = "Activities"
  const pgBarWidth = (container.w - 50 - container.pl * 2) / 2
  const activityTitle = {
    x: role.x + pgBarWidth + 50,
    y: roleTitle.y,
    mb: 45,
  }
  ctx.fillText(activityTitleStr, activityTitle.x, activityTitle.y)

  // activity
  ctx.save()
  const activityStr = `${data.nr_of_actions}`
  const flagIcon = {
    image: await Canvas.loadImage(getEmojiURL(emojis.FLAG)),
    h: 30,
    w: 25,
    x: activityTitle.x,
    y: activityTitle.y + 15,
    mr: 7,
  }
  ctx.drawImage(flagIcon.image, flagIcon.x, flagIcon.y, flagIcon.w, flagIcon.h)
  ctx.fillStyle = "#BFBFBF"
  ctx.font = "33px Manrope"
  ctx.fillText(
    activityStr,
    flagIcon.x + flagIcon.w + flagIcon.mr,
    activityTitle.y + activityTitle.mb
  )
  ctx.restore()

  // fraction XPs
  if (withFractionXp) {
    const { xps } = ptProfile
    await drawFractionProgressBar(ctx, container, role, xps)
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
  colorType: "Profile",
}

export default command
