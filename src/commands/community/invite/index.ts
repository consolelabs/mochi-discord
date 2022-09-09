import { Command } from "types/common"
import leaderboard from "./leaderboard"
import codes from "./codes"
import link from "./link"
import config from "./config"
import aggregation from "./aggregation"
import info from "./info"
import { composeEmbedMessage } from "utils/discordEmbed"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"

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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  run: async () => {},
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
        document: INVITE_GITBOOK,
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
