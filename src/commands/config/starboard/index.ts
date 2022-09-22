import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import set from "./set"
import remove from "./remove"

const actions: Record<string, Command> = {
  set,
  remove,
  list,
}

const command: Command = {
  id: "starboard",
  command: "starboard",
  brief: "Starboard configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sb <action>`,
        footer: [`Type ${PREFIX}help sb <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["sb"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
