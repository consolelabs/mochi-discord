import { Command } from "types/common"
import set from "./set"
import remove from "./remove"
import list from "./list"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX, STARBOARD_GITBOOK } from "utils/constants"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"

const actions: Record<string, Command> = {
  set,
  remove,
  list,
}

const command: Command = {
  id: "starboard_blacklist",
  command: "blacklist",
  brief: "Starboard blacklist",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const action = actions[args[2]]
    if (action) {
      return action.run(msg)
    } else {
      return {
        messageOptions: await this.getHelpMessage(msg),
      }
    }
  },
  getHelpMessage: async (msg) => {
    const args = getCommandArguments(msg)
    const action = actions[args[3]]
    if (action) {
      return action.getHelpMessage(msg)
    }
    console.log("-- this --", this)
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb blacklist <action>`,
          footer: [
            `Type ${PREFIX}help sb blacklist <action> for a specific action!`,
          ],
          description: "Config channel that cannot repost when reacting",
          examples: `${PREFIX}starboard blacklist list\n${PREFIX}sb blacklist list\n${PREFIX}starboard blacklist set 2 #secret`,
          includeCommandsList: true,
          actions,
          document: STARBOARD_GITBOOK,
        }),
      ],
    }
  },
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
