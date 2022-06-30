import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import sales from "./sales"

const actions: Record<string, Command> = {
  sales,
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "track",
  command: "track",
  brief: "NFT track",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    if (args.length < 2) {
      return {
        messageOptions: await this.getHelpMessage(msg, action),
      }
    }
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}track <action>`,
      footer: [`Type ${PREFIX}help track <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  actions,
  colorType: "Marketplace",
}

export default command
