import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import set from "./set"
import remove from "./remove"

const actions: Record<string, Command> = {
  list,
  set,
  remove,
}

const command: Command = {
  id: "monikers",
  command: "monikers",
  brief: "Moniker Configuration",
  category: "Config",
  run: async () => null,
  featured: {
    title: "Moniker",
    description: "Manage monikers configuration used in tip",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}monikers <action>`,
        examples: `${PREFIX}monikers list`,
        description: "Manage monikers configuration used in tip",
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["moniker"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
