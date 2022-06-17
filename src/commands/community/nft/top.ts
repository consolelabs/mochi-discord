import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { drawDivider, drawRectangle, heightOf, widthOf } from "utils/canvas"
import { createCanvas, loadImage } from "canvas"
import { RectangleStats } from "types/canvas"
import { TopNFTItem } from "types/community"
import {
  emojis,
  getEmoji,
  sortNFTListByVolume,
  getEmojiURL,
  mapSymbolToPrice,
  getUniqueToken,
  parseNFTTop,
} from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"

async function renderLeaderboard(msg: Message, leaderboard: TopNFTItem[]) {
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
    container.x.from + container.pl,
    container.x.to - container.pl,
    0
  )

  // collection title
  ctx.font = "bold 33px Manrope"
  ctx.fillStyle = "white"
  const cltTitleStr = "Collection"
  const cltTitle = {
    x: container.x.from + container.pl,
    y: container.pt,
    mb: 20,
  }
  ctx.fillText(cltTitleStr, cltTitle.x, cltTitle.y)

  // volume title
  const volumeTitleStr = `Volume (USD)`
  const volumeTitle = {
    x: 650,
    y: cltTitle.y,
  }
  ctx.fillText(volumeTitleStr, volumeTitle.x, volumeTitle.y)

  // collection name
  const badgeIcon = {
    w: 30,
    h: 40,
    mr: 30,
  }
  const line = {
    x: cltTitle.x,
    y: cltTitle.y + cltTitle.mb,
    h: 40,
    mb: 20,
  }
  const cltName = {
    x: line.x + badgeIcon.w + badgeIcon.mr,
    y: line.y,
    mr: 10,
  }
  ctx.font = "27px Manrope"

  for (const item of leaderboard) {
    const collectionName = item.collection_name
    cltName.y +=
      heightOf(ctx, collectionName) +
      (badgeIcon.h - heightOf(ctx, collectionName)) / 2
    const badgeImg = await loadImage(getEmojiURL(emojis[`STAR`]))
    ctx.drawImage(badgeImg, line.x, line.y, badgeIcon.w, badgeIcon.h)

    // cltName
    ctx.font = "bold 27px Manrope"
    ctx.fillStyle = "white"
    // cltName.y = line.y
    ctx.fillText(item.collection_name, cltName.x, cltName.y + 2)

    // discriminator
    const discriminator = {
      x: cltName.x + widthOf(ctx, item.collection_name) + cltName.mr,
      y: cltName.y,
      mr: 20,
    }

    // volume

    const volumeStr = `${item.trading_volume} `
    ctx.font = "bold 27px Manrope"
    ctx.fillStyle = "#BFBFBF"
    const level = {
      x: volumeTitle.x,
      y: discriminator.y,
      w: widthOf(ctx, volumeStr),
    }
    ctx.fillText(volumeStr, level.x, level.y)

    line.y += line.h + line.mb
    cltName.y = line.y
  }

  return new MessageAttachment(canvas.toBuffer(), "leaderboard.png")
}

const command: Command = {
  id: "top_nft",
  command: "top",
  brief: "Show top NFTs",
  category: "Community",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length > 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const data = await Community.getTopNFTs(msg, 10)
    let leaderboard = parseNFTTop(data)
    const tokenAvailable = getUniqueToken(leaderboard)
    const symbolPriceMap = await mapSymbolToPrice(msg, tokenAvailable)
    leaderboard = sortNFTListByVolume(leaderboard, symbolPriceMap)
    if (!data)
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
    const blank = getEmoji("blank")
    const embed = composeEmbedMessage(msg, {
      title: `${getEmoji("cup")} Top NFT rankings`,
      thumbnail: "https://i.postimg.cc/4NT4fs3d/mochi.png", //Need mochi logo url
      description: `${blank}**Highest Trading Volume**\n\u200B`,
      image: "attachment://leaderboard.png",
    })
    return {
      messageOptions: {
        embeds: [embed],
        files: [await renderLeaderboard(msg, leaderboard.slice(0, 10))],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft top`,
      }),
    ],
  }),
  canRunWithoutAction: true,
}

export default command
