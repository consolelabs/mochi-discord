import { Command } from "types/common"
import { getAllAliases } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import add from "./add"
import remove from "./remove"

const actions: Record<string, Command> = {
  add,
  remove,
  list,
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "starboard",
  command: "starboard",
  brief: "Starboard Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    } else {
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
      usage: `${PREFIX}sb <action>`,
      footer: [`Type ${PREFIX}help sb <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  aliases: ["sb"],
  actions,
  colorType: "Server",
}

export default command
