import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import add from "./add"
import remove from "./remove"

const actions: Record<string, Command> = {
  list,
  add,
  remove,
}

const command: Command = {
  id: "reactionrole",
  command: "reactionrole",
  brief: "Reaction Role Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}rr <action>`,
        footer: [`Type ${PREFIX}help rr <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["rr"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
