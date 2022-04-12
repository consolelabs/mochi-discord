import { Command } from "commands"
import {
  emojis,
  getHelpEmbed,
  getListCommands,
  workInProgress,
} from "utils/discord"
import { PREFIX, HIT_AND_BLOW_CHANNEL_ID } from "env"
import GameManager from "./GameManager"
import { DiscordWrapper, toPeg } from "./DiscordWrapper"
import { GuildMember, Message, MessageReaction } from "discord.js"

export async function handleEmoji(
  reaction: MessageReaction,
  wrapper: DiscordWrapper,
  user: GuildMember
) {
  const emoji = reaction.emoji
  switch (emoji.name) {
    case "👍":
      if (!wrapper.game.players.some((p) => p.id === user.id)) {
        wrapper.join(user, {
          id: user.id,
          name: user.displayName,
        })
      }
      break
    // case "👎":
    //   wrapper.game.leave(user.id)
    //   break
    case "✅":
      if (wrapper.ruleShown) {
        if (
          wrapper.playersReadTheRule.length ===
          wrapper.game.players.length - 1
        ) {
          if (wrapper.hostId === user.id) {
            await wrapper.game.pickCodeMaker().setAnswer()
            wrapper.game.start()
          }
        } else {
          wrapper.playersReadTheRule.push(true)
        }
      } else {
        wrapper.showRule()
      }
      break
    case "❌":
      if (wrapper.hostId === user.id) {
        GameManager.remove(wrapper)
      }
      break
    default:
      break
  }
}

export async function handleGuess(message: Message) {
  try {
    const wrapper = GameManager.get(message.author.id)
    if (wrapper.game.currentPlayer().id !== message.author.id) return
    const guesses = message.content.split(" ").map(toPeg)
    if (guesses.length !== 4) {
      message.reply(
        "Your guess is not enough, please make 4 guesses separated by space"
      )
      return
    }

    wrapper.guessMsg = message
    wrapper.action(guesses)
  } catch (e) {
    // message.reply("Your format is not correct, please try again")
  }
}

const command: Command = {
  id: "hnb",
  command: "hnb",
  name: "A code breaking game",
  category: "Games",
  checkBeforeRun: async function (msg) {
    return msg.channel.id === HIT_AND_BLOW_CHANNEL_ID
  },
  run: async (msg) => ({ messageOptions: await workInProgress(msg) }),
  getHelpMessage: async (msg) => {
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    let embed = getHelpEmbed()
      .setThumbnail(
        "https://cdn.discordapp.com/emojis/916737806288715807.png?size=240"
      )
      .setTitle(`${PREFIX}hnb`)
      .setDescription(
        `\`\`\`Hit and Blow.\`\`\`\n${getListCommands(replyEmoji ?? "╰ ", {
          hnb: {
            name: "Start a game",
            command: "hnb",
          },
        })}`
      )

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  alias: ["mastermind"],
}

export default command
