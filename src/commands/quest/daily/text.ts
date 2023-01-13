import { GuildIdNotFoundError } from "errors"
import type { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { run } from "./processor"

const command: Command = {
  id: "quest_daily",
  command: "daily",
  brief: "Your daily quests, resets at 00:00 UTC",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    return run(msg.author.id, msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}quest daily`,
          examples: `${PREFIX}quest daily`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
