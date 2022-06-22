import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Game } from "podker-game-engine"
import GameSessionManager from "utils/GameSessionManager"
import { Message, MessageReaction, User } from "discord.js"
import { getAllAliases, getCommandArguments } from "utils/commands"
import { seePokerHand, render, renderCards } from "./renderer"
import start from "./start"
import { GAME_TESTSITE_CHANNEL_ID } from "env"

const actions: Record<string, Command> = {
  start,
}
const commands: Record<string, Command> = getAllAliases(actions)

export async function reactionPoker(reaction: MessageReaction, user: User) {
  if (
    reaction.emoji.toString() === "✅" &&
    reaction.message.nonce === "poker-game"
  ) {
    const users = await reaction.users.fetch()
    const joined = users.some((u) => u.id === user.id)
    const originalMessage = await reaction.message.channel.messages.fetch(
      reaction.message.reference.messageId
    )
    const initiator = originalMessage.author
    if (initiator.id !== user.id) {
      if (joined) {
        GameSessionManager.joinSession(initiator, user)
        const session = GameSessionManager.getSession(initiator)
        if (session) {
          const {
            data: { game },
          } = session
          game.join({
            id: user.id,
            name: user.tag,
            avatar: user.displayAvatarURL(),
            balance: 100000,
            isHighest: false,
            acted: false,
            folded: false,
            result: {},
          })
        }
      } else {
        GameSessionManager.leaveSession(user)
        const session = GameSessionManager.getSession(initiator)
        if (session) {
          const {
            data: { game },
          } = session
          game.leave({ id: user.id, name: "" })
        }
      }
    }
  }
}

export async function handlePlayPoker(msg: Message) {
  if (msg.channelId === GAME_TESTSITE_CHANNEL_ID) {
    const session = GameSessionManager.getSession(msg.author)
    if (session) {
      const {
        data: { game },
      } = session
      if (game.name === "poker") {
        render(game, msg)
        if (game.done) {
          GameSessionManager.removeSession(session)
          if (Array.isArray(game.winners) && game.winners.length > 1) {
            msg.channel.send("TODO: Tie")
          } else {
            const winner = Array.isArray(game.winners)
              ? game.winners[0]
              : game.winners
            const attachment = await renderCards(
              game,
              winner.result.hand,
              winner.result.name
            )
            msg.channel.send({
              content: `The winner is ${winner.name}`,
              files: [attachment],
            })
          }
        }
      }
    }
  }
}

const command: Command = {
  id: "poker",
  command: "poker",
  brief: "Open a poker game session",
  category: "Game",
  colorType: "Game",
  run: async (msg, action) => {
    if (msg.channel.id === GAME_TESTSITE_CHANNEL_ID) {
      const actionObj = commands[action]
      if (actionObj) {
        return actionObj.run(msg)
      }

      const args = getCommandArguments(msg)
      if (args.length === 1) {
        const game = new Game()
        const session = GameSessionManager.getSession(msg.author)
        if (!session) {
          const replyMsg = await msg.reply({
            nonce: "poker-game",
            content: `${msg.author} wants to play poker, react with ✅ to join`,
          })
          replyMsg.react("✅")
          GameSessionManager.createSessionIfNotAlready(msg.author, {
            name: "poker",
            data: { message: replyMsg, game },
          })
          game.join({
            id: msg.author.id,
            name: msg.author.tag,
            avatar: msg.author.displayAvatarURL(),
            balance: 100000,
            acted: false,
            folded: false,
            isHighest: false,
            result: {},
          })
        } else {
          const session = GameSessionManager.getSession(msg.author)
          msg.reply(
            `You're already in a session (${session.name})! Type \`end\` to quit`
          )
        }
      }
    }
    return {
      messageOptions: null,
    }
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}poker`,
          usage: `${PREFIX}poker`,
          footer: [`Type ${PREFIX}help poker <action> for a specific action!`],
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  actions,
}

export default command
export { seePokerHand }
