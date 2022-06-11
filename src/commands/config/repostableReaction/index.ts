import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import set from "./set"
import remove from "./remove"

const actions: Record<string, Command> = {
  list,
  set,
  remove,
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "repostreaction",
  command: "repostreaction",
  brief: "Repost Reaction Configuration",
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
      usage: `${PREFIX}rc <action>`,
      footer: [`Type ${PREFIX}help rc <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  aliases: ["rc"],
  actions,
}

export default command
