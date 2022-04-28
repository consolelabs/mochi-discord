import { Command } from "types/common"
import { emojis, getAllAliases, getCommandArguments } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discord-embed"
import config from "./config"

const actions: Record<string, Command> = {
  config
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "gm",
  command: "gm",
  brief: "GM/GN",
  category: "Community",
  run: async function(msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    if (args.length < 2) {
      return {
        messageOptions: await this.getHelpMessage(msg, action)
      }
    }
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}gm <action>`,
      footer: [`Type ${PREFIX}help gm <action> for a specific action!`]
    })

    return { embeds: [embed] }
  },
  aliases: ["gn"],
  actions
}

export default command
