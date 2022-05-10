import { Command } from "types/common"
import leaderboard from "./leaderboard"
import codes from "./codes"
import link from "./link"
import config from "./config"
import aggregation from "./aggregation"
import info from "./info"
import { getAllAliases } from "utils/commands"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"

const actions: Record<string, Command> = {
  leaderboard,
  codes,
  link,
  config,
  aggregation,
  info
}
const commands = getAllAliases(actions)

const command: Command = {
  id: "invite",
  command: "invite",
  brief: "Invite Tracker",
  category: "Community",
  run: async function(msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    if (args.length === 1) {
      return {
        messageOptions: await this.getHelpMessage(msg, action)
      }
    }
  },
  getHelpMessage: async function(msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }

    return {
      embeds: [
        composeEmbedMessage(msg, {
          footer: [`Type ${PREFIX}help invite <action> for a specific action!`]
        })
      ]
    }
  },
  aliases: ["inv", "invites"],
  actions
}

export default command
