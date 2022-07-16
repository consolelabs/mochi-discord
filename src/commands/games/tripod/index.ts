import type { Command } from "types/common"
import { PREFIX, VERTICAL_BAR } from "utils/constants"
import {
  composeEmbedMessage,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { Game, PieceEnum, Position } from "triple-pod-game-engine"
import { shopItems, toCanvas } from "./render"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbedOptions,
} from "discord.js"
import GameSessionManager from "utils/GameSessionManager"
import ach, { achievements, composeAchievementListEmbed } from "./achievements"
import quest, { composeQuestListEmbed } from "./quest"
import profile from "./profile"
import { GAME_TESTSITE_CHANNEL_IDS } from "env"
import { fromBoardPosition, toBoardPosition } from "./helpers"
import { mappings } from "./mappings"

const buttonRow = new MessageActionRow({
  components: [
    new MessageButton({
      customId: "triple-pod-help",
      emoji: "❓",
      label: "What's next?",
      style: "SECONDARY",
    }),
    new MessageButton({
      customId: "triple-pod-achievements",
      label: "See your achievements",
      style: "SECONDARY",
    }),
    new MessageButton({
      customId: "triple-pod-quests",
      label: "See your daily quests",
      style: "SECONDARY",
    }),
  ],
})

const color = "#62A1FE"

export async function triplePodInteraction(interaction: ButtonInteraction) {
  if (GAME_TESTSITE_CHANNEL_IDS.includes(interaction.channelId)) {
    const session = GameSessionManager.getSession(interaction.user)
    if (session && !session.data.game.done) {
      const action = interaction.customId.split("-").pop()
      const game = session.data.game
      switch (action) {
        case "help": {
          const isShopItem = shopItems.some(
            (i) => i.id === game.state.currentPiece.id
          )
          if (!isShopItem) {
            await interaction.reply({
              ephemeral: true,
              embeds: [
                {
                  description: `You're holding a piece, place it on the board by typing a2, c3, d1, etc...`,
                  color,
                },
              ],
            })
          } else {
            let description = "You're holding a"
            switch (game.state.currentPiece.id) {
              case PieceEnum.AIRDROPPER:
                description +=
                  "n airdropper, type `use <target> <destination>` to use e.g `use a2 b3`"
                break
              case PieceEnum.REROLL_BOX:
                description +=
                  " reroll box, type `use` to get a new random item"
                break
              case PieceEnum.TELEPORT_PORTAL:
                description +=
                  " teleport portal, type `use <pos_1> <pos_2>` to swap e.g `use d3 d1`"
                break
              case PieceEnum.TERRAFORMER:
                description += " terraformer, type `use` to destroy all marbles"
                break
              case PieceEnum.MEGA_BOMB:
                description +=
                  " mega bomb, this will explode in a 2x2 area e.g `use d4` will destroy `d4`, `e4`, `d3`, `e3`"
                break
              case PieceEnum.BOMB:
                description +=
                  " bomb, this will explode in a 1x1 area e.g `use d4` will destroy `d4`"
                break
              default:
                break
            }
            await interaction.reply({
              ephemeral: true,
              embeds: [
                {
                  description,
                  color,
                },
              ],
            })
          }
          break
        }
        case "achievements": {
          const reply = await interaction.reply({
            fetchReply: true,
            ...(
              await composeAchievementListEmbed(session.data.message, 0)
            ).messageOptions,
          })
          listenForPaginateAction(
            reply as Message,
            session.data.message,
            composeAchievementListEmbed
          )
          break
        }
        case "quests": {
          await interaction.reply({
            ...(
              await composeQuestListEmbed(session.data.message)
            ).messageOptions,
          })
          break
        }
        default:
          break
      }
    }
  }
}

function renderHistory(game: Game) {
  const lastThreeMoves = game.history.slice(0, 3).map((m) => {
    switch (m.type) {
      case "put":
        return `Placed ${fromBoardPosition(m.x, m.y)}`
      case "buy":
        return `Bought ${mappings[m.piece.id].name}`
      case "swap":
        return `Swap`
      case "end":
        return "Ended the game"
      case "use": {
        switch (m.pieceId) {
          case PieceEnum.AIRDROPPER:
            return `An airdrop lands on ${fromBoardPosition(
              m.params.dest[0],
              m.params.dest[1]
            )}!`
          case PieceEnum.REROLL_BOX:
            return `You decided to try your luck, it turns out to be a ${
              mappings[game.state.currentPiece.id].name
            }`
          case PieceEnum.TELEPORT_PORTAL:
            return `Switcharoo! ${fromBoardPosition(
              m.params.posA[0],
              m.params.posA[1]
            )} <-> ${fromBoardPosition(m.params.posB[0], m.params.posB[1])}`
          case PieceEnum.TERRAFORMER:
            return `The ground rumbles!! all marbles are destroyed`
          case PieceEnum.MEGA_BOMB: {
            const [x, y] = m.params.pos
            return `Used a Mega Bomb to wipe out ${[
              fromBoardPosition(x, y),
              fromBoardPosition(x + 1, y),
              fromBoardPosition(x, y + 1),
              fromBoardPosition(x + 1, y + 1),
            ].join(", ")}`
          }
          case PieceEnum.BOMB:
            return `Used a Mini Bomb at ${fromBoardPosition(
              m.params.pos[0],
              m.params.pos[1]
            )}`
          default:
            return ""
        }
      }
      default:
        return ""
    }
  })

  if (lastThreeMoves.every((p) => !p)) {
    return "\u200B"
  }

  return `>>> ${lastThreeMoves.join("\n")}`
}

function additionalMessage() {
  return `\`<letter><number> e.g a2 b5\` ${VERTICAL_BAR} Place an object on a tile\n\`$tripod ach\` ${VERTICAL_BAR} View triple pod achievements\n\`$tripod daily\` ${VERTICAL_BAR} View your daily quests\n\`end\` ${VERTICAL_BAR} End the game`
}

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
        } else if (input.startsWith("use")) {
          switch (game.state.currentPiece.id) {
            case PieceEnum.AIRDROPPER: {
              const params = input.split(" ").slice(1)
              if (
                params.length !== 2 ||
                !toBoardPosition(params[0]) ||
                !toBoardPosition(params[1])
              )
                break
              game.nextState({
                type: "use",
                pieceId: PieceEnum.AIRDROPPER,
                params: {
                  target: toBoardPosition(params[0]) as Position,
                  dest: toBoardPosition(params[1]) as Position,
                },
              })
              validMsg = true
              break
            }
            case PieceEnum.REROLL_BOX:
              game.nextState({
                type: "use",
                pieceId: PieceEnum.REROLL_BOX,
                params: {},
              })
              validMsg = true
              break
            case PieceEnum.TELEPORT_PORTAL: {
              const params = input.split(" ").slice(1)
              if (
                params.length !== 2 ||
                !toBoardPosition(params[0]) ||
                !toBoardPosition(params[1])
              )
                break
              game.nextState({
                type: "use",
                pieceId: PieceEnum.TELEPORT_PORTAL,
                params: {
                  posA: toBoardPosition(params[0]) as Position,
                  posB: toBoardPosition(params[1]) as Position,
                },
              })
              validMsg = true
              break
            }
            case PieceEnum.TERRAFORMER:
              game.nextState({
                type: "use",
                pieceId: PieceEnum.TERRAFORMER,
                params: {},
              })
              validMsg = true
              break
            case PieceEnum.MEGA_BOMB: {
              const params = input.split(" ").slice(1)
              if (params.length !== 1 || !toBoardPosition(params[0])) break
              game.nextState({
                type: "use",
                pieceId: PieceEnum.MEGA_BOMB,
                params: {
                  pos: toBoardPosition(params[0]) as Position,
                },
              })
              validMsg = true
              break
            }
            case PieceEnum.BOMB: {
              const params = input.split(" ").slice(1)
              if (params.length !== 1 || !toBoardPosition(params[0])) break
              game.nextState({
                type: "use",
                pieceId: PieceEnum.BOMB,
                params: {
                  pos: toBoardPosition(params[0]) as Position,
                },
              })
              validMsg = true
              break
            }
            default:
              break
          }
        } else {
          const pos = toBoardPosition(input)
          if (!pos) return
          const [x, y] = pos
          game.nextState({ type: "put", x, y })
          validMsg = true
        }
        if (validMsg) {
          const embeds: Array<MessageEmbedOptions> = [
            {
              fields: [
                {
                  name: "Activity",
                  value: renderHistory(game),
                  inline: true,
                },
                {
                  name: "Address",
                  value: `[\`0x649...AcC23\`](https://pod.town)`,
                  inline: true,
                },
              ],
              color,
            },
            {
              image: { url: "attachment://board.png" },
              color,
            },
            {
              description: additionalMessage(),
              color,
            },
          ]
          const reply = await msg.reply({
            ...(!game.done ? { components: [buttonRow] } : {}),
            embeds,
            files: [await toCanvas(game, msg)],
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
        await msg.reply({
          components: [buttonRow],
          embeds: [
            {
              fields: [
                { name: "Activity", value: renderHistory(game), inline: true },
                {
                  name: "Address",
                  value: `[\`0x649...AcC23\`](https://pod.town)`,
                  inline: true,
                },
              ],
              color,
            },
            {
              image: { url: "attachment://board.png" },
              color,
            },
            {
              description: additionalMessage(),
              color,
            },
          ],
          files: [await toCanvas(game, msg)],
        })
        GameSessionManager.createSessionIfNotAlready(msg.author, {
          name: "triple-town",
          data: { message: msg, game, user: msg.author },
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
