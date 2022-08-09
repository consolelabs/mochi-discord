import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import list from "./list"
import remove from "./remove"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"

const actions: Record<string, Command> = {
  set,
  list,
  remove,
}

const command: Command = {
  id: "twitter",
  command: "twitter",
  brief: "Configure your server's PoE through twitter",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const action = actions[args[2]]
    if (action) {
      return action.run(msg)
    } else {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
  },
  getHelpMessage: async (msg) => {
    const args = getCommandArguments(msg)
    const action = actions[args[3]]
    if (action) {
      return action.getHelpMessage(msg)
    }

    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}poe twitter <action>`,
          footer: [`Type ${PREFIX}poe twitter <action> for a specific action!`],
          includeCommandsList: true,
          title: "PoE > Twitter",
          actions,
        }),
      ],
    }
  },
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
