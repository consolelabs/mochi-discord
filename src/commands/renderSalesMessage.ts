import profile from "adapters/profile"
import { Message, MessageAttachment } from "discord.js"
import { UserProfile } from "types/profile"
import { composeEmbedMessage } from "utils/discordEmbed"
import * as Canvas from "canvas"
import {
  drawAvatar,
  heightOf,
  widthOf,
  drawRectangleAvatar,
} from "utils/canvas"
import { drawRectangle } from "utils/canvas"
import { CircleleStats, RectangleStats } from "types/canvas"
import { emojis, getEmojiURL, shortenHashOrAddress } from "utils/common"

async function renderSalesMessage(msg: Message, data: UserProfile) {
  let withFractionXp = data.guild?.global_xp
  let ptProfile
  if (data.guild?.global_xp) {
    ptProfile = await profile.getPodTownUser(msg.author.id)
  }
  withFractionXp = withFractionXp && !!ptProfile && ptProfile.is_verified

  const container = {
    x: {
      from: 0,
      to: withFractionXp ? 1350 : 1020,
    },
    y: {
      from: 0,
      to: withFractionXp ? 1040 : 660,
    },
    w: 0,
    h: 0,
    pl: 5,
    pt: 5,
    // bgColor: "#303137",
    bgColor: "#2F3136",
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
  ctx.restore()

  // avatar
  const avatar: CircleleStats = {
    x: container.pl,
    y: container.pt,
    radius: 30,
    mr: 0,
    mb: 0,
  }
  avatar.x += avatar.radius
  avatar.y += avatar.radius
  await drawAvatar(ctx, avatar, msg.author)

  // username
  ctx.fillStyle = "#0DB4FB"
  ctx.font = "680 40px Whitney"
  const username = {
    w: widthOf(ctx, msg.author.username),
    h: heightOf(ctx, msg.author.username),
    x: container.pl + avatar.radius * 2 + container.pl + 20,
    y: container.pt + avatar.radius * 2 - 10,
    mb: 25,
    mr: 25,
  }
  ctx.fillText(msg.author.username, username.x, username.y)

  ctx.fillStyle = "#BFBFBF"
  ctx.font = "27px Whitney"
  const subUsername = {
    w: widthOf(ctx, msg.author.username),
    h: heightOf(ctx, msg.author.username),
    x: container.pl,
    y: avatar.y + 2 * avatar.radius + avatar.mb + 15,
    mb: 15,
    mr: 15,
  }
  ctx.fillText(msg.author.username, subUsername.x, subUsername.y)

  //discriminator
  ctx.save()
  ctx.font = "27px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const discriminator = {
    x: subUsername.x + subUsername.w + subUsername.mr,
    y: subUsername.y,
  }
  ctx.fillText(
    `#${msg.author.discriminator} sold!`,
    discriminator.x,
    discriminator.y
  )
  ctx.restore()

  //rarity title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const rarityStr = "Rarity"
  const rarity = {
    x: container.pl,
    y: subUsername.y + subUsername.mb + 2 * subUsername.h,
  }
  ctx.fillText(rarityStr, rarity.x, rarity.y)
  ctx.restore()

  const xpIcon = {
    image: await Canvas.loadImage(getEmojiURL(emojis.SPARKLE)),
    h: 35,
    w: 45,
    x: container.pl,
    y: rarity.y + heightOf(ctx, rarityStr),
  }
  ctx.drawImage(xpIcon.image, xpIcon.x, xpIcon.y, xpIcon.w, xpIcon.h)

  const xpText = "Legendary"
  const xpTitle = {
    x: xpIcon.x + xpIcon.w + 10,
    y: xpIcon.y + 30,
  }
  ctx.fillStyle = "#FFDE6A"
  ctx.font = "580 30px Whitney"
  ctx.fillText(xpText, xpTitle.x, xpTitle.y)

  //marketplace title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const marketPlaceStr = "Marketplace"
  const marketPlace = {
    x: container.pl,
    y: xpTitle.y + 2 * heightOf(ctx, xpText),
  }
  ctx.fillText(marketPlaceStr, marketPlace.x, marketPlace.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const marketPlaceTextStr = "OpenSea"
  const marketPlaceText = {
    x: container.pl,
    y: marketPlace.y + 2 * heightOf(ctx, "Market"),
  }
  ctx.fillText(marketPlaceTextStr, marketPlaceText.x, marketPlaceText.y)
  ctx.restore()

  //From title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const fromStr = "From"
  const from = {
    x: container.pl,
    y: marketPlaceText.y + 60,
  }
  ctx.fillText(fromStr, from.x, from.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Menlo"
  const fromAddresss = `0x000000000000000000000000000`
  const fromTextStr = `${shortenHashOrAddress(fromAddresss)}`
  const fromText = {
    x: container.pl + 5,
    y: from.y + 2 * heightOf(ctx, fromStr),
  }
  ctx.fillStyle = "#0F0F10"
  ctx.fillRect(rarity.x, from.y + 12, widthOf(ctx, fromTextStr) + 10, 45)

  ctx.fillStyle = "#0DB4FB"
  ctx.fillText(fromTextStr, fromText.x, fromText.y)
  ctx.restore()

  //Price title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const priceStr = "Price"
  const price = {
    x: container.pl,
    y: fromText.y + 60,
  }
  ctx.fillText(priceStr, price.x, price.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#0DB4FB"
  const priceTextStr = `0.012 ETH`
  const priceText = {
    x: container.pl,
    y: price.y + 2 * heightOf(ctx, priceStr),
  }
  ctx.fillText(priceTextStr, priceText.x, priceText.y)
  ctx.restore()

  //HODL title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const hodlStr = "HODL"
  const hodl = {
    x: container.pl,
    y: priceText.y + 60,
  }
  ctx.fillText(hodlStr, hodl.x, hodl.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const hodlTextStr = "44 days"
  const hodlText = {
    x: container.pl,
    y: hodl.y + 2 * heightOf(ctx, hodlStr),
  }
  ctx.fillText(hodlTextStr, hodlText.x, hodlText.y)
  ctx.restore()

  //Rank title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const rankStr = "Rank"
  const rank = {
    x: container.pl + widthOf(ctx, fromTextStr),
    y: rarity.y,
  }
  ctx.fillText(rankStr, rank.x, rank.y)
  ctx.restore()

  const rankIcon = {
    image: await Canvas.loadImage(getEmojiURL(emojis.CUP)),
    h: 35,
    w: 45,
    x: rank.x,
    y: xpIcon.y,
  }
  ctx.drawImage(rankIcon.image, rankIcon.x, rankIcon.y, rankIcon.w, rankIcon.h)

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const rankTextStr = "938"
  const rankText = {
    x: rank.x + 60,
    y: xpTitle.y,
  }
  ctx.fillText(rankTextStr, rankText.x, rankText.y)
  ctx.restore()

  //Transaction title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const transactionStr = "Transaction"
  const transaction = {
    x: rank.x,
    y: marketPlace.y,
  }
  ctx.fillText(transactionStr, transaction.x, transaction.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Menlo"
  const transactionAddress = "0x3fs345458000000004000"

  const transactionTextStr = `${shortenHashOrAddress(transactionAddress)}`
  const transactionText = {
    x: rank.x + 5,
    y: marketPlaceText.y,
  }
  ctx.fillStyle = "#0F0F10"
  ctx.fillRect(
    rank.x,
    transaction.y + 12,
    widthOf(ctx, transactionTextStr) + 10,
    45
  )

  ctx.fillStyle = "#0DB4FB"
  ctx.fillText(transactionTextStr, transactionText.x, transactionText.y)
  ctx.restore()

  //To title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const toStr = "To"
  const to = {
    x: rank.x,
    y: from.y,
  }
  ctx.fillText(toStr, to.x, to.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Menlo"
  const toAddresss = "0x3fs345469999999994000"
  const toTextStr = `${shortenHashOrAddress(toAddresss)}`
  const toText = {
    x: rank.x + 5,
    y: fromText.y,
  }
  ctx.fillStyle = "#0F0F10"
  ctx.fillRect(rank.x, to.y + 12, widthOf(ctx, toTextStr) + 10, 45)

  ctx.fillStyle = "#0DB4FB"
  ctx.fillText(toTextStr, toText.x, toText.y)
  ctx.restore()

  //bought title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const boughtStr = "Bought"
  const bought = {
    x: rank.x,
    y: price.y,
  }
  ctx.fillText(boughtStr, bought.x, bought.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const boughtTextStr = "0.011 ETH"
  const boughtText = {
    x: rank.x,
    y: priceText.y,
  }
  ctx.fillText(boughtTextStr, boughtText.x, boughtText.y)
  ctx.restore()

  //Gain title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const gainStr = "Gain"
  const gain = {
    x: rank.x,
    y: hodl.y,
  }
  ctx.fillText(gainStr, gain.x, gain.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const gainTextStr = "0.002 ETH"
  const gainText = {
    x: rank.x,
    y: hodlText.y,
  }
  ctx.fillText(gainTextStr, gainText.x, gainText.y)
  ctx.restore()

  //Sold title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const soldStr = "Sold"
  const sold = {
    x: rank.x + widthOf(ctx, transactionTextStr) + 10,
    y: price.y,
  }
  ctx.fillText(soldStr, sold.x, sold.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const soldTextStr = "0.012 ETH"
  const soldText = {
    x: sold.x,
    y: priceText.y,
  }
  ctx.fillText(soldTextStr, soldText.x, soldText.y)
  ctx.restore()

  //Pnl title
  ctx.save()
  ctx.font = "580 35px Whitney"
  ctx.fillStyle = "white"
  const pnlStr = "PnL"
  const pnl = {
    x: sold.x,
    y: hodl.y,
  }
  ctx.fillText(pnlStr, pnl.x, pnl.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Whitney"
  ctx.fillStyle = "#BFBFBF"
  const pnlTextStr = "$2.19"
  const pnlText = {
    x: sold.x,
    y: hodlText.y,
  }
  ctx.fillText(pnlTextStr, pnlText.x, pnlText.y)
  ctx.restore()

  ctx.save()
  ctx.font = "30px Menlo"
  const pnlSubTextStr = "+72.66%"
  const pnlSubText = {
    x: sold.x + widthOf(ctx, pnlTextStr) + 17,
    y: hodlText.y,
  }

  ctx.fillStyle = "#0F0F10"
  ctx.fillRect(
    sold.x + widthOf(ctx, pnlTextStr) + 12,
    pnl.y + 12,
    widthOf(ctx, pnlSubTextStr) + 10,
    2 * heightOf(ctx, pnlSubTextStr)
  )
  ctx.fillStyle = "#9FFFE4"
  ctx.fillText(`${pnlSubTextStr}`, pnlSubText.x, pnlSubText.y)
  ctx.restore()

  // square avatar
  const bigAvatar: RectangleStats = {
    x: { from: sold.x - 15, to: sold.x + 235 },
    y: { from: rank.y, to: rank.y + 250 },
    w: 250,
    h: 250,
    mr: 0,
    mb: 0,
    radius: 20,
  }
  await drawRectangleAvatar(ctx, bigAvatar, msg.author)

  return new MessageAttachment(canvas.toBuffer(), "renderSaleMessages.png")
}

export async function renderSalesMessages(
  msg: Message,
  guildId: string,
  authorId: string
) {
  const data = await profile.getUserProfile(guildId, authorId)

  const embed = composeEmbedMessage(msg, {
    image: "attachment://renderSaleMessages.png",
  })

  return {
    messageOptions: {
      embeds: [embed],
      files: [await renderSalesMessage(msg, data)],
    },
  }
}
