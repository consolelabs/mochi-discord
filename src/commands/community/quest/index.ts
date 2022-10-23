import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import daily from "./daily"

const actions: Record<string, Command> = {
  daily,
}

const command: Command = {
  id: "quest",
  command: "quest",
  brief: "Shows the quests you currently have",
  category: "Community",
  run: async function (msg, action) {
    if (!action) return daily.run(msg)
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      description: "Check on your quests and what rewards you can claim",
      usage: `${PREFIX}quest`,
      footer: [`Type ${PREFIX}help quest`],
      examples: `${PREFIX}quest`,
    })

    return { embeds: [embed] }
  },
  actions,
  colorType: "Server",
  canRunWithoutAction: true,
}

export default command
