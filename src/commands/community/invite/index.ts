import { Command } from "types/common"
import leaderboard from "./leaderboard"
import codes from "./codes"
import link from "./link"
import config from "./config"
import aggregation from "./aggregation"
import { emojis, getCommandArguments, getListCommands } from "utils/common"
import { composeEmbedMessage } from "utils/discord-embed"
import { PREFIX } from "utils/constants"

export const originalCommands: Record<string, Command> = {
  leaderboard,
  codes,
  link,
  config,
  aggregation,
}

const aliases: Record<string, Command> = Object.entries(
  originalCommands
).reduce((acc, cur) => {
  const [_name, commandObj] = cur
  
  const als = (commandObj.alias? commandObj.alias : []).reduce((aliasObject, alias) => {
    return {
      ...aliasObject,
      [alias]: commandObj,
    }
  }, {})

  return {
    ...acc,
    ...als,
  }
}, {})

const commands: Record<string, Command> = {
  ...originalCommands,
  ...aliases,
}

const command: Command = {
  id: "invite",
  command: "invite",
  name: "Invite Tracker",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    if (args.length === 1) {
      return {
        messageOptions: await this.getHelpMessage(msg, action),
      }
    }

    const mentionedUser = args[1]
    // TODO: handle to show a user's invites'
    // TODO: validate mentioned user, e.g. <@12312312313>
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    const embed = composeEmbedMessage(msg, {
      description: `${getListCommands(replyEmoji ?? "╰ ", originalCommands)}`,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  alias: ["inv", "invites"],
}

export default command
