import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import config from "./config"
import track from "./track"

const actions: Record<string, Command> = {
  config,
  track,
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "sales",
  command: "sales",
  brief: "NFT Sales update",
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
      usage: `${PREFIX}sales <action>`,
      footer: [`Type ${PREFIX}help sale <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  actions,
}

export default command
