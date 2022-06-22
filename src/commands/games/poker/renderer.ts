import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
} from "discord.js"
import { Game } from "podker-game-engine"
import { createCanvas, Image, loadImage } from "canvas"
import { drawRectangle, heightOf, widthOf } from "utils/canvas"
import { RectangleStats } from "types/canvas"
import GameSessionManager from "utils/GameSessionManager"

const scale = 3
const cardW = 90 * scale
const cardH = 126 * scale
const gap = 10
const padding = 20

const cardImagesBySuitAndRank: Record<string, Record<string, Image>> = {
  "1": {},
  "2": {},
  "3": {},
  "4": {},
}

let facedownCard: Image

const containerColor = "rgba(27, 36, 48, 0.8)"

async function getCardImage(rank: number, suit: number) {
  let img = cardImagesBySuitAndRank[String(suit)][String(rank)]
  if (!img) {
    img = await loadImage(`src/assets/poker/${rank}_${suit}.png`)
    cardImagesBySuitAndRank[String(suit)][String(rank)] = img
  }
  return img
}

export async function seePokerHand(interaction: ButtonInteraction) {
  const user = interaction.user
  const session = GameSessionManager.getSession(user)
  if (session) {
    const {
      data: { game },
    } = session
    if (game.name === "poker") {
      const player = game.activePlayers.find((p) => p.id === user.id)
      const attachments = [player.card1, player.card2].map(async (card) => {
        const img = await getCardImage(card.rank, card.suit)
        return new MessageAttachment(img.src, `${card.name}.png`)
      })
      await interaction.reply({
        ephemeral: true,
        files: await Promise.all(attachments),
      })
    }
  }
}

export async function renderCards(
  game: Game,
  board = game.state.board,
  titleParam?: string
) {
  const w = 5 * cardW + 4 * gap + 2 * padding
  const h = cardH + 100
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext("2d")
  let y = 0

  // fill background
  const img = await loadImage("src/assets/poker/background-pattern.png")
  const bgPattern = ctx.createPattern(img, "repeat")
  ctx.fillStyle = bgPattern
  ctx.fillRect(0, 0, w, h)

  let title = titleParam
  if (!title) {
    if (game.state.roundNo === 1) {
      title = "Pre-flop"
    } else if (game.state.roundNo === 2) {
      title = "The Flop"
    } else if (game.state.roundNo === 3) {
      title = "The Turn"
    } else if (game.state.roundNo === 4) {
      title = "The River"
    } else {
      title = "Showdown!"
    }
  }
  ctx.font = "30px Arial"
  const titleSize: RectangleStats = {
    x: {
      from: w / 2 - widthOf(ctx, title) / 2 - padding,
      to: w / 2 - widthOf(ctx, title) / 2 + widthOf(ctx, title) + padding,
    },
    y: {
      from: padding,
      to: heightOf(ctx, title) + 2 * padding,
    },
    radius: 5,
    w: widthOf(ctx, title) + 2 * padding,
    h: heightOf(ctx, title) + 2 * padding,
  }
  drawRectangle(ctx, titleSize, containerColor)
  ctx.fillText(title, titleSize.x.from + padding, titleSize.h - padding / 2)

  y = padding + titleSize.h
  const promises = [
    ...board,
    ...new Array(Math.abs(board.length - 5)).fill(0),
  ].map(async (card, i) => {
    if (card === 0) {
      if (!facedownCard) {
        facedownCard = await loadImage("src/assets/poker/card.png")
      }
      ctx.drawImage(
        facedownCard,

        padding + i * (gap + cardW),
        y,
        cardW,
        cardH
      )
    } else {
      const cardImage = await getCardImage(card.rank, card.suit)
      ctx.drawImage(cardImage, padding + i * (gap + cardW), y, cardW, cardH)
    }
  })

  await Promise.all(promises)
  return new MessageAttachment(canvas.toBuffer(), "poker.png")
}

export async function render(game: Game, msg: Message) {
  if (msg && !game.done) {
    const playerId = msg.author.id
    const [action, amount] = msg.content.trim().split(" ")
    const { options } = game.status
    if (
      playerId === game.currentPlayer.id &&
      ["check", "bet", "call", "raise", "fold"].includes(action) &&
      options[action as keyof typeof options] &&
      !Number.isNaN(Number(amount)) &&
      Number(amount) > 0
    ) {
      game.nextState({
        type: action.toLowerCase().trim() as any,
        amount: Number(amount),
      })
    }
    if (game.done) return
    const { pot } = game.status
    const attachment = await renderCards(game)

    const embed = new MessageEmbed()
    embed.setTitle(`${game.currentPlayer.name}'s turn`)
    embed.setThumbnail(game.currentPlayer.avatar)
    embed.setDescription(
      `Pot: ${pot}\nYou have: ${game.currentPlayer.balance}\nMinimum bet amount is: ${game.state.highestBet}`
    )
    embed.setImage("attachment://poker.png")
    const seeHand = new MessageButton({
      customId: "poker-see-hand",
      emoji: "👀",
      style: "SECONDARY",
      label: "See your hand",
    })

    const users = await msg.guild.members.fetch()
    const user = users.get(game.currentPlayer.id).user

    msg.channel.send({
      content: `${user}`,
      embeds: [embed],
      components: [new MessageActionRow().addComponents(seeHand)],
      files: [attachment],
    })
  }
}
