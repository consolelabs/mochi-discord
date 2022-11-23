import { Command } from "types/common"
import { DEFAULT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import remove from "./remove"
import info from "./info"
import { getEmoji } from "utils/common"

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
  featured: {
    title: `${getEmoji("")} Default role`,
    description:
      "Set a default role that will automatically assigned to newcomers when they first join your server",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}dr <action>\n${PREFIX}defaultrole <action>`,
        examples: `${PREFIX}defaultrole info\n${PREFIX}dr info\n${PREFIX}defaultrole set @visitor`,
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
