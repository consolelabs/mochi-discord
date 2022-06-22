import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import add from "./add"
import remove from "./remove"

const actions: Record<string, Command> = {
  list,
  add,
  remove,
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "reactionrole",
  command: "reactionrole",
  brief: "Reaction Role Configuration",
  category: "Config",
  onlyAdministrator: true,
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
    if (!actionObj) {
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
      usage: `${PREFIX}rr <action>`,
      footer: [`Type ${PREFIX}help rr <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  aliases: ["rr"],
  actions,
  colorType: "Server",
}

export default command
