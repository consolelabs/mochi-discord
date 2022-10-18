import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import info from "./info"
import remove from "./remove"
import { PREFIX, LOG_CHANNEL_GITBOOK } from "utils/constants"

const actions: Record<string, Command> = {
  set,
  info,
  remove,
}

const command: Command = {
  id: "join-leave",
  command: "join-leave",
  brief: "Notify guild members joining and leaving",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        includeCommandsList: true,
        usage: `${PREFIX}join-leave <action>`,
        description:
          "Configure a channel to monitor guild members joining and leaving",
        footer: [
          `Type ${PREFIX}help join-leave <action> for a specific action!`,
        ],
        document: LOG_CHANNEL_GITBOOK,
        title: "Join-leave channel",
        examples: `${PREFIX}join-leave info`,
      }),
    ],
  }),
  colorType: "Server",
  aliases: ["jl"],
  actions,
}

export default command
