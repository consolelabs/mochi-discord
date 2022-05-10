import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import config from "./config"
import streak from "./streak"
import info from "./info"

const actions: Record<string, Command> = {
  config,
  streak,
  info
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "gm",
  command: "gm",
  brief: "GM/GN",
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
      usage: `${PREFIX}gm <action>`,
      footer: [`Type ${PREFIX}help gm <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  aliases: ["gn"],
  actions,
}

export default command
