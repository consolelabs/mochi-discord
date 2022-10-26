import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import info from "./info"
import { PREFIX, LOG_CHANNEL_GITBOOK } from "utils/constants"

const actions: Record<string, Command> = {
  set,
  info,
}

const command: Command = {
  id: "log",
  command: "log",
  brief: "Monitor guild members' activities",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        includeCommandsList: true,
        usage: `${PREFIX}log <action>`,
        description:
          "Configure a log channel to monitor guild members' activities",
        footer: [`Type ${PREFIX}help log <action> for a specific action!`],
        document: LOG_CHANNEL_GITBOOK,
        title: "Log channel",
        examples: `${PREFIX}log info`,
      }),
    ],
  }),
  colorType: "Server",
  actions,
}

export default command
