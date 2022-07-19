import type { Command } from "types/common"
import { PREFIX, VERTICAL_BAR } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Game, Piece, PieceEnum, Position } from "triple-pod-game-engine"
import { shopItems, toCanvas } from "./render"
import {
  ButtonInteraction,
  ColorResolvable,
  Message,
  MessageActionRow,
  MessageButton,
  ReplyMessageOptions,
} from "discord.js"
import GameSessionManager from "utils/GameSessionManager"
import ach from "./achievements"
import quest from "./quest"
import profile from "./profile"
import { GAME_TESTSITE_CHANNEL_IDS } from "env"
import { fromBoardPosition, toBoardPosition } from "./helpers"
import { mappings } from "./mappings"
import { tripodEmojis } from "utils/common"

const getButtonRow = (userId: string) =>
  new MessageActionRow({
    components: [
      new MessageButton({
        customId: `triple-pod-${userId}-help`,
        emoji: "❓",
        label: "Help",
        style: "SECONDARY",
      }),
    ],
  })

const color: ColorResolvable = "#62A1FE"

async function getMessageOptions(
  game: Game,
  msg: Message,
  showHelp = false
): Promise<ReplyMessageOptions> {
  return {
    components: [getButtonRow(msg.author.id)],
    embeds: [
      {
        fields: [
          { name: "Activity", value: renderHistory(game), inline: true },
          {
            name: "Hint",
            value: showHint(game.state.currentPiece),
            inline: true,
          },
          {
            name: "Game ID",
            value: `>>> \`${game.id}\`\n(session expires after 5 min)`,
            inline: true,
          },
        ],
        color,
      },
      {
        image: { url: "attachment://board.png" },
        color,
      },
      ...(showHelp ? [{ description: additionalMessage(), color }] : []),
    ],
    files: [await toCanvas(game, msg)],
  }
}

export async function triplePodInteraction(interaction: ButtonInteraction) {
  if (GAME_TESTSITE_CHANNEL_IDS.includes(interaction.channelId)) {
    const session = GameSessionManager.getSession(interaction.user)
    const action = interaction.customId.split("-").at(-1)
    const userId = interaction.customId.split("-").at(-2)
    if (session && !session.data.game.done && interaction.user.id === userId) {
      const game = session.data.game
      switch (action) {
        case "help": {
          interaction.deferUpdate()
          const msg = interaction.message as Message
          await msg.edit(await getMessageOptions(game, msg, true))
          break
        }
        default:
          break
      }
    }
  }
}

function renderHistory(game: Game) {
  const lastMoves = game.history.slice(0, 4).map((m) => {
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
            return `An airdrop lands on \`${fromBoardPosition(
              m.params.dest[0],
              m.params.dest[1]
            )}!\``
          case PieceEnum.REROLL_BOX:
            return `You decided to try your luck, it turns out to be a ${
              mappings[game.state.currentPiece.id].name
            }`
          case PieceEnum.TELEPORT_PORTAL:
            return `Switch place! \`${fromBoardPosition(
              m.params.posA[0],
              m.params.posA[1]
            )}\` <-> \`${fromBoardPosition(
              m.params.posB[0],
              m.params.posB[1]
            )}\``
          case PieceEnum.TERRAFORMER:
            return `The ground rumbles!! All marbles are destroyed`
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

  if (lastMoves.every((p) => !p)) {
    return ">>> Your action history\nwill be shown here\n(shows last 4 moves)\n\u200B"
  }

  return `>>> ${lastMoves.join("\n")}`
}

function additionalMessage() {
  return `\`<letter><number> e.g a2 b5\` ${VERTICAL_BAR} Place an object on a tile\n\`$tripod ach\` ${VERTICAL_BAR} View triple pod achievements\n\`$tripod daily\` ${VERTICAL_BAR} View your daily quests\n\`end\` ${VERTICAL_BAR} End the game`
}

function showHint(p: Piece) {
  switch (p.id) {
    case PieceEnum.AIRDROPPER:
      return ">>> `use <target> <destination>`\ne.g `use a2 b3` means to clone the piece at a2 and place it at b3\n\u200B"
    case PieceEnum.REROLL_BOX:
      return ">>> `use`\nThis will overwrite your current piece\n\u200B\n\u200B"
    case PieceEnum.TELEPORT_PORTAL:
      return ">>> `use <pos_1> <pos_2>`\ne.g `use d3 d5` means to swap d3 with d5\n\u200B\n\u200B"
    case PieceEnum.TERRAFORMER:
      return ">>> `use`\nIf there are no marbles on board, the item will still be consumed\n\u200B\n\u200B"
    case PieceEnum.MEGA_BOMB:
      return ">>> `use <pos>`\n e.g `use a4` will destroy a4/b4/a3/b3\n`a4 b4` <- like this\n`a3 b3`"
    case PieceEnum.BOMB:
      return ">>> `use <pos>`\n e.g `use b3` will destroy the piece at b3\n\u200B\n\u200B"
    case PieceEnum.ROBOT:
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\n\u200B\nThere is a 50% that the bomb will miss and do nothing"
    case PieceEnum.BEAR:
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\n\u200B\nEvery turn it will move up/down/left/right 1 tile"
    case PieceEnum.NINJA_BEAR:
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\n\u200B\nRocket Droid jumps to any tile that is empty"
    case PieceEnum.CRYSTAL:
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\nMimic slime clones the piece adjacent to it to make a match, if there is no match it will turn into a marble"
    default: {
      const piece = tripodEmojis[mappings[p?.id]?.emojiName.toUpperCase()]
      const nextPiece =
        tripodEmojis[mappings[p.nextTierPiece?.id]?.emojiName.toUpperCase()]
      const nextSuperPiece =
        tripodEmojis[
          mappings[p.nextSuperTierPiece?.id]?.emojiName.toUpperCase()
        ]
      let text = ">>> Specify position e.g `a2`, `d4`, `c3`"
      if (piece && nextPiece && nextSuperPiece) {
        text += `\n\u200B\n${[
          `<:_:${piece}>`,
          " + ",
          `<:_:${piece}>`,
          " + ",
          `<:_:${piece}>`,
          " = ",
          `<:_:${nextPiece}>`,
        ].join("")}\n${[
          `<:_:${piece}>`,
          " + ",
          `<:_:${piece}>`,
          " + ",
          `<:_:${piece}>`,
          " + ",
          `<:_:${piece}>`,
          " = ",
          `<:_:${nextSuperPiece}>`,
        ].join("")}`
        return text
      }
      text += `\n\u200B`.repeat(3)
      return text
    }
  }
}

export async function handlePlayTripod(msg: Message) {
  if (GAME_TESTSITE_CHANNEL_IDS.includes(msg.channel.id) && msg.content) {
    const session = GameSessionManager.getSession(msg.author)
    if (session) {
      const { name, data } = session
      const input = msg.content.trim().toLowerCase()
      if (name === "triple-town") {
        msg.channel.sendTyping()
        const { game } = data
        let validMsg = false
        if (input === "end" || game.done) {
          game.nextState({ type: "end" })
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
          // TODO: needs BE to persist data
          await msg.reply(await getMessageOptions(game, msg))
          // Object.entries(achievements.turn).forEach(([achName, achDetail]) => {
          //   if (achDetail.check(game)) {
          //     reply.reply(`Achievement unlocked: \`${achName}\``)
          //   }
          // })
          if (game.done) {
            GameSessionManager.leaveSession(msg.author)
            GameSessionManager.removeSession(session)
            // TODO: needs BE to persist data
            // Object.entries(achievements.session).forEach(
            //   ([achName, achDetail]) => {
            //     if (achDetail.check(game)) {
            //       reply.reply(`Achievement unlocked: \`${achName}\``)
            //     }
            //   }
            // )
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
        await msg.reply(await getMessageOptions(game, msg))
        GameSessionManager.createSessionIfNotAlready(msg.author, {
          name: "triple-town",
          data: { game },
        })
      } else {
        msg.reply(`You're already in a session! Type \`end\` to quit`)
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
