import { Command } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import remove from "./remove"
import info from "./info"

const actions: Record<string, Command> = {
  set,
  remove,
  info,
}

const command: Command = {
  id: "defaultrole",
  command: "defaultrole",
  brief: "Default Role Configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}dr <action>`,
        description:
          "Set a default role that will automatically assigned to newcomers when they first join your server",
        footer: [`Type ${PREFIX}help dr <action> for a specific action!`],
        includeCommandsList: true,
        document: DEFAULT_ROLE_GITBOOK,
      }),
    ],
  }),
  aliases: ["dr"],
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
