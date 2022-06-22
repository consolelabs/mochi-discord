import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import GameSessionManager from "utils/GameSessionManager"
import { getCommandArguments } from "utils/commands"
import { render } from "./renderer"

const command: Command = {
  id: "poker_start",
  command: "start",
  brief: "Start the game",
  category: "Game",
  colorType: "Game",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    if (args.length === 2 && args[1].toLowerCase() === "start") {
      const session = GameSessionManager.getSession(msg.author)
      if (session) {
        const {
          data: { game },
        } = session
        if (game.name === "poker") {
          game.start()
          render(game, msg)
        }
      }
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}poker start`,
          usage: `${PREFIX}poker start`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
