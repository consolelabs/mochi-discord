import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import report from "./csvExport"
import create from "./create"
import info from "./info"
import add from "./add"
import list from "./list"
import check from "./check"

const actions: Record<string, Command> = {
  report,
  create,
  info,
  add,
  list,
  check,
}

const command: Command = {
  id: "whitelist",
  command: "whitelist",
  brief: "Whitelist management",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}whitelist <action>`,
        footer: [
          `Type ${PREFIX}help whitelist <action> for a specific action!`,
        ],
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["wl"],
  actions,
  colorType: "Command",
}

export default command
