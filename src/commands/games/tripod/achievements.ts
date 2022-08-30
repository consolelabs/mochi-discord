import { Message, MessageAttachment } from "discord.js"
import { Event, Game, PieceEnum } from "triple-pod-game-engine"
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
import { createCanvas, loadImage } from "canvas"
import { firestore } from "utils/firebase"

function isTransform(e: Event): e is Extract<Event, { type: "transform" }> {
  return e.type === "transform"
}

function isCondense(e: Event): e is Extract<Event, { type: "condense" }> {
  return e.type === "condense"
}

export const achievements = {
  turn: {
    "Droid Apocalypse": {
      id: 1,
      description: `Destroy 12 or more ${
        mappings[PieceEnum.BEAR].name
      }s in one turn`,
      check: (game: Game) =>
        game.state.events[0].filter(
          (e) => isTransform(e) && e.to === PieceEnum.TOMB
        ).length >= 12,
    },
    "Droid Doom": {
      id: 2,
      description: `Destroy 6 or more ${
        mappings[PieceEnum.BEAR].name
      }s in one turn`,
      check: (game: Game) =>
        game.state.events[0].filter(
          (e) => isTransform(e) && e.to === PieceEnum.TOMB
        ).length >= 6,
    },
    Headshot: {
      id: 3,
      description: `Take down a ${mappings[PieceEnum.NINJA_BEAR].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isTransform(e) && e.from === PieceEnum.NINJA_BEAR
        ),
    },
    "Ca-ching!": {
      id: 4,
      description: `Create a ${mappings[PieceEnum.TREASURE].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isTransform(e) && e.to === PieceEnum.TREASURE
        ),
    },
    "It's payday": {
      id: 5,
      description: `Create a ${mappings[PieceEnum.LARGE_TREASURE].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isTransform(e) && e.to === PieceEnum.LARGE_TREASURE
        ),
    },
    Test: {
      id: 0,
      description: ``,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.BUSH
        ),
    },
    "Upper Class": {
      id: 6,
      description: `Build a ${mappings[PieceEnum.MANSION].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.MANSION
        ),
    },
    "Upper-Upper Class": {
      id: 7,
      description: `Build a ${mappings[PieceEnum.SUPER_MANSION].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.SUPER_MANSION
        ),
    },
    "Royal Welcome": {
      id: 8,
      description: `Build a ${mappings[PieceEnum.CASTLE].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.CASTLE
        ),
    },
    "Kings before Dukes": {
      id: 9,
      description: `Build a ${mappings[PieceEnum.SUPER_CASTLE].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.SUPER_CASTLE
        ),
    },
    "Walking on Air": {
      id: 10,
      description: `Build a ${mappings[PieceEnum.FLOATING_CASTLE].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.FLOATING_CASTLE
        ),
    },
    Showoff: {
      id: 11,
      description: `Build a ${mappings[PieceEnum.SUPER_FLOATING_CASTLE].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.SUPER_FLOATING_CASTLE
        ),
    },
    Unbeatable: {
      id: 12,
      description: `Build a ${mappings[PieceEnum.TRIPLE_CASTLE].name}`,
      check: (game: Game) =>
        game.state.events[0].some(
          (e) => isCondense(e) && e.to === PieceEnum.TRIPLE_CASTLE
        ),
    },
    "Be water, my friend": {
      id: 13,
      description: `Use a ${mappings[PieceEnum.CRYSTAL].name} to match`,
      check: (game: Game) =>
        game.state.events
          .flat()
          .find((e) => isCondense(e) && e.from === PieceEnum.CRYSTAL),
    },
  },
  session: {
    "No stones unturned": {
      id: 14,
      description: `Create then clear all rock(s) before the game ends`,
      check: (game: Game) =>
        game.state.board
          .flat()
          .every(
            (c) =>
              c.id !== PieceEnum.ROCK &&
              game.state.events
                .flat()
                .some((e) => isTransform(e) && e.to === PieceEnum.ROCK)
          ),
    },
  },
  game: {
    "Rookie matcher": {
      id: 15,
      description: `Perform 100 matches`,
      check: () => false,
    },
    "Apprentice matcher": {
      id: 16,
      description: `Perform 200 matches`,
      check: () => false,
    },
    "Adept matcher": {
      id: 17,
      description: `Perform 400 matches`,
      check: () => false,
    },
    "Master matcher": {
      id: 18,
      description: `Perform 700 matches`,
      check: () => false,
    },
    "PhD in matching": {
      id: 19,
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

const achievementsKey = "achievements"
const achievementsRef = firestore?.collection(achievementsKey)

export async function checkPersistAchievements(game: Game) {
  if (!achievementsRef) return []
  const docRef = achievementsRef.doc(game.players[0].id)
  const promises = achievementsList.map(async ([achName, ach]) => {
    const doc = await docRef.get()
    const data = doc.data()
    if (ach.check(game) && (!doc.exists || !data?.[ach.id])) {
      return [
        ach.id,
        {
          name: achName,
          description: ach.description,
        },
      ]
    }
    return ""
  })

  let achievements = (await Promise.all(promises)) as Array<
    [number, { name: string; description: string }]
  >
  achievements = achievements.filter(Boolean)
  const achievementsObj = Object.fromEntries(achievements)
  await docRef.set(achievementsObj, { merge: true })

  return achievements
}

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
          name: `${a[0]}`,
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

    return null
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
