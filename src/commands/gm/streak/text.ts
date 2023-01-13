import { Command } from "types/common"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { GuildIdNotFoundError } from "errors"
import { handle } from "./processor"

const command: Command = {
  id: "gm_streak",
  command: "streak",
  brief: "Show user's gm/gn streak",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    return await handle(msg.author.id, msg.guildId)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}gm streak`,
          examples: `${PREFIX}gm streak`,
          document: `${GM_GITBOOK}&action=streak`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
