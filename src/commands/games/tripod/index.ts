import type { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Game } from "triple-pod-game-engine"
import { renderShop, shop, toCanvas } from "./render"
import { Message } from "discord.js"
import GameSessionManager from "utils/GameSessionManager"
import { achievements } from "./achievements"
import { getEmoji } from "utils/common"
import { GAME_TESTSITE_CHANNEL_ID } from "env"

export async function handlePlayTripod(msg: Message) {
  if (msg.channelId === GAME_TESTSITE_CHANNEL_ID) {
    const session = GameSessionManager.getSession(msg.author)
    if (session) {
      const { name, data } = session
      const input = msg.content.trim().toLowerCase()
      if (name === "triple-town") {
        const { game } = data
        if (input === "end" || game.done) {
          game.nextState({ type: "end" })
          GameSessionManager.leaveSession(msg.author)
          GameSessionManager.removeSession(session)
        } else if (input.startsWith("buy")) {
          const [, num] = input.split(" ")
          if (shop[Number(num) - 1]) {
            game.nextState({ type: "buy", piece: shop[Number(num) - 1] })
          }
        } else if (input === "swap") {
          game.nextState({ type: "swap" })
        } else {
          const [_x, _y] = input.split("")
          const [x, y] = [Number(_x), Number(_y)]
          if (!Number.isNaN(x) && !Number.isNaN(y)) {
            game.nextState({ type: "put", x: x - 1, y: y - 1 })
          }
        }
        Object.entries(achievements.turn).forEach(([achName, achCheck]) => {
          if (achCheck(game.state.combos)) {
            msg.channel.send(`Achievement unlocked: \`${achName}\``)
          }
        })
        await msg.channel.send({
          embeds: [
            {
              title: `Points: ${game.state.points}`,
              description: renderShop(),
              image: { url: "attachment://board.png" },
            },
          ],
          files: [await toCanvas(game)],
        })
        if (game.done) {
          msg.channel.send("Game end")
          Object.entries(achievements.session).forEach(
            ([achName, achCheck]) => {
              if (achCheck(game.state.history)) {
                msg.channel.send(`Achievement unlocked: \`${achName}\``)
              }
            }
          )
        }
      }
    }
  }
}

const command: Command = {
  id: "tripod",
  command: "tripod",
  brief: "Triple Town",
  category: "Game",
  colorType: "Game",
  run: async function (msg) {
    if (msg.channel.id === GAME_TESTSITE_CHANNEL_ID) {
      const session = GameSessionManager.getSession(msg.author)
      if (!session) {
        const game = new Game()
        game.start()
        const botMessage = await msg.reply({
          content: getEmoji("num_1"),
          embeds: [
            {
              title: `Points: ${game.state.points}`,
              description: renderShop(),
              image: { url: "attachment://board.png" },
            },
          ],
          files: [await toCanvas(game)],
        })
        GameSessionManager.createSessionIfNotAlready(msg.author, {
          name: "triple-town",
          data: { message: botMessage, game },
        })
      } else {
        msg.reply("You're already in a session! Type `end` to quit")
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
          examples: `${PREFIX}tripod @hnh`,
          usage: `${PREFIX}tripod <@user>`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  experimental: true,
}

export default command
