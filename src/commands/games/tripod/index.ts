import type { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Game } from "triple-pod-game-engine"
import { shopItems, toCanvas } from "./render"
import { Message, MessageEmbedOptions } from "discord.js"
import GameSessionManager from "utils/GameSessionManager"
import ach, { achievements } from "./achievements"
import quest from "./quest"
import profile from "./profile"
import { GAME_TESTSITE_CHANNEL_IDS } from "env"
import { normalizePosition } from "./helpers"
import { mappings } from "./mappings"

export async function handlePlayTripod(msg: Message) {
  if (GAME_TESTSITE_CHANNEL_IDS.includes(msg.channel.id) && msg.content) {
    const session = GameSessionManager.getSession(msg.author)
    if (session) {
      const { name, data } = session
      const input = msg.content.trim().toLowerCase()
      if (name === "triple-town") {
        const { game } = data
        let validMsg = false
        if (input === "end" || game.done) {
          game.nextState({ type: "end" })
          GameSessionManager.leaveSession(msg.author)
          GameSessionManager.removeSession(session)
          validMsg = true
        } else if (input.startsWith("buy")) {
          const [, num] = input.split(" ")
          if (shopItems[Number(num) - 1]) {
            game.nextState({ type: "buy", piece: shopItems[Number(num) - 1] })
            validMsg = true
          }
        } else if (input === "swap") {
          game.nextState({ type: "swap" })
          validMsg = true
        } else {
          const pos = normalizePosition(input)
          if (!pos) return
          const [x, y] = pos
          game.nextState({ type: "put", x, y })
          validMsg = true
        }
        if (validMsg) {
          const embeds: Array<MessageEmbedOptions> = [
            {
              image: { url: "attachment://board.png" },
              color: "#62A1FE",
            },
          ]
          if (!game.done) {
            embeds.push({
              description: `Place a ${
                mappings[game.state.currentPiece.id].name
              }`,
              color: "#62A1FE",
            })
          } else {
            embeds.push({
              description: "Game end",
            })
          }
          const reply = await msg.reply({
            embeds,
            files: [await toCanvas(game)],
          })
          Object.entries(achievements.turn).forEach(([achName, achDetail]) => {
            if (achDetail.check(game)) {
              reply.reply(`Achievement unlocked: \`${achName}\``)
            }
          })
          if (game.done) {
            Object.entries(achievements.session).forEach(
              ([achName, achDetail]) => {
                if (achDetail.check(game)) {
                  reply.reply(`Achievement unlocked: \`${achName}\``)
                }
              }
            )
          }
        }
      }
    }
  }
}

const actions: Record<string, Command> = {
  ach,
  daily: quest,
  profile,
}

const command: Command = {
  id: "tripod",
  command: "tripod",
  brief: "Triple Town",
  category: "Game",
  colorType: "Game",
  run: async function (msg) {
    if (GAME_TESTSITE_CHANNEL_IDS.includes(msg.channel.id) && msg.content) {
      const session = GameSessionManager.getSession(msg.author)
      if (!session) {
        const game = new Game()
        game.start()
        const botMessage = await msg.reply({
          embeds: [
            {
              image: { url: "attachment://board.png" },
              color: "#62A1FE",
            },
            {
              description: `Place a ${
                mappings[game.state.currentPiece.id].name
              }`,
              color: "#62A1FE",
            },
          ],
          files: [await toCanvas(game)],
        })
        GameSessionManager.createSessionIfNotAlready(msg.author, {
          name: "triple-town",
          data: { message: botMessage, game },
        })
      } else {
        const session = GameSessionManager.getSession(msg.author)
        msg.reply(
          `You're already in a session (${session.name})! Type \`end\` to quit`
        )
      }
    }
    return {
      messageOptions: null,
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}tripod`,
          usage: `${PREFIX}tripod`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  experimental: true,
  actions,
}

export default command
