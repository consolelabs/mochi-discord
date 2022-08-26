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
  TextChannel,
} from "discord.js"
import GameSessionManager from "utils/GameSessionManager"
import ach, { checkPersistAchievements } from "./achievements"
import quest from "./quest"
import profile from "./profile"
import top from "./top"
import { GAME_TRIPOD_CHANNEL_IDS, GAME_TRIPOD_TEST_CHANNEL_ID, PROD } from "env"
import { fromBoardPosition, toBoardPosition } from "./helpers"
import { mappings } from "./mappings"
import { tripodEmojis } from "utils/common"

const images = {
  achievement_unlocked:
    "https://cdn.discordapp.com/attachments/984660970624409630/1002841687103635476/tripod-ach_unlocked.png",
  quest_completed:
    "https://cdn.discordapp.com/attachments/984660970624409630/1002841687397253200/tripod-quest_completed.png",
  cheatsheet:
    "https://cdn.discordapp.com/attachments/884726476900036628/1001055367872135298/cheatsheet.png",
  banner:
    "https://media.discordapp.net/attachments/984660970624409630/999250271731462244/tripod-banner.png",
}

const color: ColorResolvable = "#62A1FE"
const achievementColor: ColorResolvable = "#c9c96c"
// const questColor: ColorResolvable = "#6bdbca"

function getEmoji(id?: PieceEnum) {
  if (!id) return ""
  return `<:_:${tripodEmojis[mappings[id]?.emojiName.toUpperCase()]}>`
}

const getButtonRow = (userId: string) =>
  new MessageActionRow({
    components: [
      new MessageButton({
        customId: `triple-pod-${userId}-help`,
        emoji: "❓",
        label: "Help",
        style: "SECONDARY",
      }),
      new MessageButton({
        customId: `triple-pod-${userId}-cheatsheet`,
        emoji: "📜",
        label: "Cheatsheet",
        style: "SECONDARY",
      }),
    ],
  })

async function getMessageOptions(
  game: Game,
  msg: Message,
  bal?: number | string
): Promise<ReplyMessageOptions> {
  return {
    components: [getButtonRow(msg.author.id)],
    embeds: [
      {
        image: {
          url: images.banner,
        },
        color,
      },
      {
        image: { url: "attachment://board.png" },
        color,
      },
      {
        description: `\`${game.id}\``,
        fields: [
          { name: "Activity", value: renderHistory(game), inline: true },
          {
            name: "Hint",
            value: showHint(game.state.currentPiece),
            inline: true,
          },
          {
            name: "\u200B",
            value: `<:_:974507016536072242> Powered by [Mochi](https://discord.gg/XQR36DQQGh)`,
          },
        ],
        color,
      },
    ],
    files: [await toCanvas(game, msg, bal)],
  }
}

export async function triplePodInteraction(interaction: ButtonInteraction) {
  if (GAME_TRIPOD_CHANNEL_IDS.includes(interaction.channelId)) {
    const session = GameSessionManager.getSession(interaction.user.id)
    const action = interaction.customId.split("-").at(-1)
    const userId = interaction.customId.split("-").at(-2)
    if (session && !session.data.game.done && interaction.user.id === userId) {
      switch (action) {
        case "help": {
          await interaction.reply({
            ephemeral: true,
            embeds: [
              {
                description: additionalMessage(),
                color,
              },
            ],
          })
          break
        }
        case "cheatsheet":
          await interaction.reply({
            ephemeral: true,
            content: images.cheatsheet,
          })
          break
        default:
          break
      }
    }
  }
}

function renderHistory(game: Game) {
  const lastMoves = game.history.slice(0, 4).map((m, i) => {
    const events = game.state.events
    const condenses = [...events[i]]
      .reverse()
      .map((e, i) => {
        if (e.type === "condense") {
          if (i === 0) return `${getEmoji(e.from)} -> ${getEmoji(e.to)}`
          return `-> ${getEmoji(e.to)}`
        }
        return
      })
      .filter(Boolean)
    const destroy = [...events[i]]
      .reverse()
      .filter((e) => e.type === "destroy")[0]
    const isMiss = events[i].reverse().some((e) => e.type === "miss")
    const isCombo = condenses.length > 1
    const isMatch = condenses.length > 0
    const comboStr = condenses.join(" ")

    switch (m.type) {
      case "put": {
        if (isMiss) {
          return `Unstable bomb missed!? ${fromBoardPosition(m.x, m.y)}`
        } else if (destroy && destroy.type === "destroy") {
          return `Boom, ${getEmoji(destroy.pieces[0])} was destroyed`
        }
        return `${
          isCombo ? "Combo!!" : isMatch ? "Match!" : "Placed"
        } \`${fromBoardPosition(m.x, m.y)}\`${
          isMatch || isCombo ? `, ${comboStr}` : ""
        }`
      }
      case "buy":
        return `Bought ${mappings[m.piece.id].name}`
      case "swap":
        return `Swap`
      case "end":
        return "Game ended"
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
    return ">>> Your action history\nwill be shown here\n(last 4 moves)\n\u200B"
  }

  return `>>> ${lastMoves.join("\n")}`
}

function additionalMessage() {
  return `\`<letter><number> e.g a2 b5\` ${VERTICAL_BAR} Place an object on a tile\n\`${PREFIX}tripod ach\` ${VERTICAL_BAR} View triple pod achievements\n\`${PREFIX}tripod daily\` ${VERTICAL_BAR} View your daily quests\n\`${PREFIX}tripod top\` ${VERTICAL_BAR} View leaderboard\n\`end\` ${VERTICAL_BAR} End the game`
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
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\nThere is a 50% that the bomb will miss and do nothing"
    case PieceEnum.BEAR:
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\n\u200B\nEvery turn it will move up/down/left/right 1 tile"
    case PieceEnum.NINJA_BEAR:
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\n\u200B\nRocket Droid jumps to any tile that is empty"
    case PieceEnum.CRYSTAL:
      return ">>> Specify position e.g `a2`, `d4`, `c3`\n\u200B\nMimic slime clones the piece adjacent to it to make a match, if there is no match it will turn into a marble"
    default: {
      const piece = getEmoji(p?.id)
      const nextPiece = getEmoji(p.nextTierPiece?.id)
      const nextSuperPiece = getEmoji(p.nextSuperTierPiece?.id)
      let text = ">>> Specify position e.g `a2`, `d4`, `c3`"
      if (piece && nextPiece && nextSuperPiece) {
        text += `\n\u200B\n${[
          piece,
          " + ",
          piece,
          " + ",
          piece,
          " = ",
          nextPiece,
        ].join("")}\n${[
          piece,
          " + ",
          piece,
          " + ",
          piece,
          " + ",
          piece,
          " = ",
          nextSuperPiece,
        ].join("")}`
        return text
      }
      text += `\n\u200B`.repeat(3)
      return text
    }
  }
}

export async function handlePlayTripod(msg: Message) {
  if (GAME_TRIPOD_CHANNEL_IDS.includes(msg.channel.id) && msg.content) {
    const session = GameSessionManager.getSession(msg.author.id)
    if (session) {
      const { name, data } = session
      const input = msg.content.trim().toLowerCase()
      if (name === "triple-pod") {
        msg.channel.sendTyping()
        const { game } = data
        let validMsg = false
        let errorMsg = null
        if (input === "end" || game.done) {
          const { error, valid } = game.nextState({ type: "end" })
          validMsg = valid
          errorMsg = error
        } else if (input.startsWith("buy")) {
          const balance = data.balance
          const [, num] = input.split(" ")
          const shopItem = shopItems[Number(num) - 1]
          if (shopItem && shopItem.price <= balance) {
            const { error, valid } = game.nextState({
              type: "buy",
              piece: shopItem,
            })
            validMsg = valid
            errorMsg = error
            if (valid) {
              const newBalance = Math.max(0, balance - shopItem.price)
              session.data.balance = newBalance
            }
          }
        } else if (input === "swap") {
          const { error, valid } = game.nextState({ type: "swap" })
          validMsg = valid
          errorMsg = error
        } else if (input.startsWith("use")) {
          switch (game.state.currentPiece.id) {
            case PieceEnum.AIRDROPPER: {
              const params = input.split(" ").slice(1)
              if (
                params.length !== 2 ||
                !toBoardPosition(params[0]) ||
                !toBoardPosition(params[1])
              ) {
                errorMsg = "Wrong command, check the `hint` section"
                break
              }
              const { error, valid } = game.nextState({
                type: "use",
                pieceId: PieceEnum.AIRDROPPER,
                params: {
                  target: toBoardPosition(params[0]) as Position,
                  dest: toBoardPosition(params[1]) as Position,
                },
              })
              validMsg = valid
              errorMsg = error
              break
            }
            case PieceEnum.REROLL_BOX: {
              const { error, valid } = game.nextState({
                type: "use",
                pieceId: PieceEnum.REROLL_BOX,
                params: {},
              })
              validMsg = valid
              errorMsg = error
              break
            }
            case PieceEnum.TELEPORT_PORTAL: {
              const params = input.split(" ").slice(1)
              if (
                params.length !== 2 ||
                !toBoardPosition(params[0]) ||
                !toBoardPosition(params[1])
              ) {
                errorMsg = "Wrong command, check the `hint` section"
                break
              }
              const { error, valid } = game.nextState({
                type: "use",
                pieceId: PieceEnum.TELEPORT_PORTAL,
                params: {
                  posA: toBoardPosition(params[0]) as Position,
                  posB: toBoardPosition(params[1]) as Position,
                },
              })
              validMsg = valid
              errorMsg = error
              break
            }
            case PieceEnum.TERRAFORMER: {
              const { error, valid } = game.nextState({
                type: "use",
                pieceId: PieceEnum.TERRAFORMER,
                params: {},
              })
              validMsg = valid
              errorMsg = error
              break
            }
            case PieceEnum.MEGA_BOMB: {
              const params = input.split(" ").slice(1)
              if (params.length !== 1 || !toBoardPosition(params[0])) {
                errorMsg = "Wrong command, check the `hint` section"
                break
              }
              const { error, valid } = game.nextState({
                type: "use",
                pieceId: PieceEnum.MEGA_BOMB,
                params: {
                  pos: toBoardPosition(params[0]) as Position,
                },
              })
              validMsg = valid
              errorMsg = error
              break
            }
            case PieceEnum.BOMB: {
              const params = input.split(" ").slice(1)
              if (params.length !== 1 || !toBoardPosition(params[0])) {
                errorMsg = "Wrong command, check the `hint` section"
                break
              }
              const { error, valid } = game.nextState({
                type: "use",
                pieceId: PieceEnum.BOMB,
                params: {
                  pos: toBoardPosition(params[0]) as Position,
                },
              })
              validMsg = valid
              errorMsg = error
              break
            }
            default:
              break
          }
        } else if (!PROD && input.startsWith("put")) {
          // admin mode, for developing locally only
          const [coord, pieceId] = input.split(" ").slice(1)
          const pos = toBoardPosition(coord)
          if (!pos) return
          const [x, y] = pos
          game.nextState({
            type: "admin-put",
            pieceId: Number(pieceId as unknown as PieceEnum),
            x,
            y,
          })
          validMsg = true
        } else {
          const pos = toBoardPosition(input)
          if (!pos) return
          const [x, y] = pos
          const { error, valid } = game.nextState({ type: "put", x, y })
          validMsg = valid
          errorMsg = error
        }
        if (validMsg) {
          // resync session data
          GameSessionManager.getSession(msg.author.id)
          await msg.reply(await getMessageOptions(game, msg, data.balance))
          if (game.done) {
            msg.channel.send(`\`${game.id}\` game ended`)
            GameSessionManager.leaveSession(msg.author.id)
            GameSessionManager.removeSession(session)
          }
          checkPersistAchievements(game).then((achievements) => {
            if (achievements.length > 0) {
              msg.channel.send({
                embeds: [
                  {
                    color: achievementColor,
                    image: {
                      url: images.achievement_unlocked,
                    },
                  },
                  {
                    color: achievementColor,
                    description: `Congrats ${
                      msg.author
                    }! You've unlocked the following achievements:\n>>> ${achievements
                      .map((a) => `**${a[1].name}**`)
                      .join("\n")}`,
                  },
                ],
              })
            }
          })
        } else if (!validMsg && errorMsg) {
          await msg.reply({
            content: errorMsg,
          })
        }
      }
    }
  }
}

const actions: Record<string, Command> = {
  ach,
  daily: quest,
  profile,
  top,
}

const command: Command = {
  id: "tripod",
  command: "tripod",
  brief: "Triple Town",
  category: "Game",
  colorType: "Game",
  run: async function (msg) {
    if (
      GAME_TRIPOD_CHANNEL_IDS.includes(msg.channel.id) &&
      msg.content &&
      msg.guild
    ) {
      const session = GameSessionManager.getSession(msg.author.id)
      if (!session) {
        const game = new Game()
        game.join({ name: msg.author.username, id: msg.author.id })
        game.start()
        const bal =
          msg.channel.id === GAME_TRIPOD_TEST_CHANNEL_ID ? Infinity : 2000
        await msg.reply(await getMessageOptions(game, msg, bal))
        GameSessionManager.createSessionIfNotAlready(msg.author.id, {
          name: "triple-pod",
          data: {
            game,
            userId: msg.author.id,
            guild: msg.guild.name,
            channel: (msg.channel as TextChannel).name,
            username: msg.author.username,
            discriminator: msg.author.discriminator,
            balance: bal,
          },
        })
      } else {
        msg.reply(`You're already in a session! Type \`end\` to quit`)
      }
    }
    return null
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
