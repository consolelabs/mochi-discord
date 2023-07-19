import { GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { handle } from "./processor"

const command: Command = {
  id: "proposal_info",
  command: "info",
  brief: "Proposal Info",
  category: "Defi",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    return await handle(msg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}proposal info`,
        examples: `${PREFIX}proposal info`,
      }),
    ],
  }),
  colorType: "Defi",
  minArguments: 2,
}

export default command
