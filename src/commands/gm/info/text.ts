import { Command } from "types/common"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { GuildIdNotFoundError } from "errors"
import { handle } from "./processor"

const command: Command = {
  id: "gm_info",
  command: "info",
  brief: "Show current gm/gn configuration",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    return await handle(msg.guildId)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "Show current gm/gn configuration",
          usage: `${PREFIX}gm info`,
          examples: `${PREFIX}gm info`,
          document: `${GM_GITBOOK}&action=info`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
  onlyAdministrator: true,
}

export default command
