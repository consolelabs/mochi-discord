import { SlashCommand } from "types/common"
import { GuildMember, MessageAttachment, CommandInteraction } from "discord.js"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"
import { drawDivider, drawRectangle, heightOf, widthOf } from "utils/canvas"
import { createCanvas, loadImage } from "canvas"
import { RectangleStats } from "types/canvas"
import { LeaderboardItem } from "types/community"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { SlashCommandBuilder } from "@discordjs/builders"

async function renderLeaderboard(
  interaction: CommandInteraction,
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
    const member: GuildMember | undefined = await interaction.guild?.members
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

const command: SlashCommand = {
  name: "top",
  category: "Community",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("top")
      .setDescription("Show members with the highest server XP score")
      .addStringOption((option) =>
        option
          .setName("page")
          .setDescription("list page number.")
          .setRequired(false)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const pageStr = interaction.options.getString("page")
    let page = pageStr ? +pageStr : 0
    page = Math.max(isNaN(page) ? 0 : page - 1, 0)
    const data = await Community.getTopXPUsers(
      interaction.guildId || "",
      interaction.user.id,
      page,
      10
    )
    if (!data || !data.leaderboard || !data.leaderboard.length)
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: interaction.guild?.name ?? "Ranking",
              description: "No ranking data found",
              originalMsgAuthor: interaction?.user,
            }),
          ],
        },
      }

    const { author, leaderboard } = data
    const blank = getEmoji("blank")
    const embed = composeEmbedMessage(null, {
      title: `${getEmoji("cup")} ${interaction.guild?.name}'s Web3 rankings`,
      thumbnail: interaction.guild?.iconURL(),
      description: `${blank}**Your rank:** #${author.guild_rank}\n${blank}**XP:** ${author.total_xp}\n\u200B`,
      image: "attachment://leaderboard.png",
      originalMsgAuthor: interaction?.user,
    })

    return {
      messageOptions: {
        embeds: [embed],
        files: [await renderLeaderboard(interaction, leaderboard)],
      },
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}top [page]`,
        examples: `${SLASH_PREFIX}top\n${SLASH_PREFIX}top 2`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
