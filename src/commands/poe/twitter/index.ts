import { Command } from "types/common"
import { PREFIX, TWITTER_WATCH_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import { getCommandArguments } from "utils/commands"
import { hasAdministrator } from "utils/common"
import { CommandNotAllowedToRunError } from "errors"
import block from "./block"
import list from "./list/text"
import remove from "./remove/text"
import set from "./set/text"
import stats from "./stats/text"

const actions: Record<string, Command> = {
  block,
  list,
  remove,
  set,
  stats,
}

const command: Command = {
  id: "twitter",
  command: "twitter",
  brief: "Configure your server's PoE through twitter",
  category: "Config",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const action = actions[args[2]]
    if (!action) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    if (
      (action.onlyAdministrator && hasAdministrator(msg.member)) ||
      !action.onlyAdministrator
    ) {
      return action.run(msg)
    } else {
      throw new CommandNotAllowedToRunError({
        message: msg,
        command: msg.content,
        missingPermissions:
          msg.channel.type === "DM" ? undefined : ["Administrator"],
      })
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
          examples: `${PREFIX}poe twitter list`,
          footer: [`Type ${PREFIX}poe twitter <action> for a specific action!`],
          description:
            "Forward any tweets that contains a user-specified keyword from Twitter to Discord server",
          document: TWITTER_WATCH_GITBOOK,
          includeCommandsList: true,
          title: "PoE - Twitter tweet watcher",
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
