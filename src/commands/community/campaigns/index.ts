import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import report from "./csvExport"
import create from "./create"
import info from "./info"
import add from "./add"
import list from "./list"
import check from "./check"

const actions: Record<string, Command> = {
  report,
  create,
  info,
  add,
  list,
  check
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "whitelist",
  command: "whitelist",
  brief: "Whitelist management",
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
      usage: `${PREFIX}whitelist <action>`,
      footer: [`Type ${PREFIX}help whitelist <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  aliases: ["wl"],
  actions,
}

export default command
