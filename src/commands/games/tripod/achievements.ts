import { Message, MessageAttachment } from "discord.js"
import { Game, PieceEnum } from "triple-pod-game-engine"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  composeNameDescriptionList,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { mappings } from "./mappings"
import chunk from "lodash.chunk"
import { defaultEmojis } from "utils/common"
import { createCanvas, loadImage } from "canvas"

export const achievements = {
  turn: {
    "Droid Apocalypse": {
      description: `Destroy 12 or more ${
        mappings[PieceEnum.BEAR].name
      }s in one turn`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.num >= 12 && c.into === PieceEnum.TOMB),
    },
    "Droid Doom": {
      description: `Destroy 6 or more ${
        mappings[PieceEnum.BEAR].name
      }s in one turn`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.num >= 6 && c.into === PieceEnum.TOMB),
    },
    Headshot: {
      description: `Take down a ${mappings[PieceEnum.NINJA_BEAR].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.from === PieceEnum.NINJA_BEAR),
    },
    "Ca-ching!": {
      description: `Create a ${mappings[PieceEnum.TREASURE].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.TREASURE),
    },
    "It's payday": {
      description: `Create a ${mappings[PieceEnum.LARGE_TREASURE].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.LARGE_TREASURE),
    },
    "Upper Class": {
      description: `Build a ${mappings[PieceEnum.MANSION].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.MANSION),
    },
    "Upper-Upper Class": {
      description: `Build a ${mappings[PieceEnum.SUPER_MANSION].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.SUPER_MANSION),
    },
    "Royal Welcome": {
      description: `Build a ${mappings[PieceEnum.CASTLE].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.CASTLE),
    },
    "Kings before Dukes": {
      description: `Build a ${mappings[PieceEnum.SUPER_CASTLE].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.SUPER_CASTLE),
    },
    "Walking on Air": {
      description: `Build a ${mappings[PieceEnum.FLOATING_CASTLE].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.FLOATING_CASTLE),
    },
    Showoff: {
      description: `Build a ${mappings[PieceEnum.SUPER_FLOATING_CASTLE].name}`,
      check: (game: Game) =>
        game.state.combos.some(
          (c) => c.into === PieceEnum.SUPER_FLOATING_CASTLE
        ),
    },
    Unbeatable: {
      description: `Build a ${mappings[PieceEnum.TRIPLE_CASTLE].name}`,
      check: (game: Game) =>
        game.state.combos.some((c) => c.into === PieceEnum.TRIPLE_CASTLE),
    },
    "Be water, my friend": {
      description: `Use a ${mappings[PieceEnum.CRYSTAL].name} to match`,
      check: (game: Game) =>
        game.state.events
          .flat()
          .find((e) => e.type === "condense" && e.from === PieceEnum.CRYSTAL),
    },
  },
  session: {
    "No stones unturned": {
      description: `Create then clear all rock(s) before the game ends`,
      check: (game: Game) =>
        game.state.board
          .flat()
          .every(
            (c) =>
              c.id !== PieceEnum.ROCK &&
              game.state.events
                .flat()
                .some((e) => e.type === "transform" && e.to === PieceEnum.ROCK)
          ),
    },
  },
  game: {
    "Rookie matcher": {
      description: `Perform 100 matches`,
      check: () => false,
    },
    "Apprentice matcher": {
      description: `Perform 200 matches`,
      check: () => false,
    },
    "Adept matcher": {
      description: `Perform 400 matches`,
      check: () => false,
    },
    "Master matcher": {
      description: `Perform 700 matches`,
      check: () => false,
    },
    "PhD in matching": {
      description: `Perform 1100 matches`,
      check: () => false,
    },
  },
}

const achievementsList = [
  ...Object.entries(achievements.turn),
  ...Object.entries(achievements.session),
  ...Object.entries(achievements.game),
]

const pageSize = 5
const size = 200

export async function composeAchievementListEmbed(
  msg: Message,
  pageIdx: number
) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")
  const avatar = msg.author.displayAvatarURL({ format: "jpeg" })
  ctx.drawImage(await loadImage(avatar), 0, 0, size, size)
  const bomb = await loadImage(
    "https://cdn.discordapp.com/attachments/984660970624409630/992011434366083172/bomb.png"
  )

  ctx.fillStyle = "#1d475f"
  ctx.beginPath()
  ctx.moveTo(size + 60, 0)
  ctx.lineTo(0, size + 60)
  ctx.lineTo(size + 60, size + 60)
  ctx.fill()
  ctx.drawImage(bomb, size / 6, size / 20, size * 1.5, size * 1.5)

  const img = canvas.toBuffer()

  const totalPage = Math.ceil(achievementsList.length / pageSize)
  const embed = composeEmbedMessage(msg, {
    title: "Tripod Achievements",
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })
    .setDescription(
      composeNameDescriptionList(
        chunk(achievementsList, 5)[pageIdx].map((a) => ({
          name: `${a[0]}${
            Math.random() > 0.5 ? ` ${defaultEmojis.CHECK}` : ""
          }`,
          description: a[1].description,
        }))
      )
    )
    .setThumbnail("attachment://img.jpeg")

  return {
    messageOptions: {
      embeds: [embed],
      files: [new MessageAttachment(img, "img.jpeg")],
      components: getPaginationRow(pageIdx, totalPage),
    },
  }
}

const command: Command = {
  id: "tripod_achievements",
  command: "achievements",
  brief: "See Tripod's list of achievements",
  category: "Game",
  colorType: "Game",
  run: async function (msg) {
    const msgOpts = await composeAchievementListEmbed(msg, 0)
    const reply = await msg.reply(msgOpts.messageOptions)
    listenForPaginateAction(reply, msg, composeAchievementListEmbed)

    return {
      messageOptions: null,
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tripod ach`,
        examples: `${PREFIX}tokens ach`,
      }),
    ],
  }),
}

export default command
