import { Command } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { process } from "./processor"

const command: Command = {
  id: "proposal_data",
  command: "data",
  brief: "List all dao proposal usage stats",
  category: "Config",
  run: process,
  getHelpMessage: (msg) => {
    return Promise.resolve({
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${SLASH_PREFIX}proposal data`,
          examples: `${SLASH_PREFIX}proposal data`,
        }),
      ],
    })
  },
  canRunWithoutAction: true,
  colorType: "Server",
  experimental: true,
}

export default command
