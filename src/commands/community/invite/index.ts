import { Command } from "types/common"
import leaderboard from "./leaderboard"
import codes from "./codes"
import link from "./link"
import config from "./config"
import aggregation from "./aggregation"
import info from "./info"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"

const actions: Record<string, Command> = {
  leaderboard,
  codes,
  link,
  config,
  aggregation,
  info,
}

const command: Command = {
  id: "invite",
  command: "invite",
  brief: "Invite Tracker",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["inv", "invites"],
  actions,
  colorType: "Command",
  canRunWithoutAction: false,
}

export default command
