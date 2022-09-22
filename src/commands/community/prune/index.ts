import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import inactive from "./inactive"
import without from "./without"

const actions: Record<string, Command> = {
  inactive,
  without,
}

const command: Command = {
  id: "prune",
  command: "prune",
  brief: "Member Pruning",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune <option>`,
        description: "Options to prune a group of members",
        examples: `${PREFIX}prune inactive\n${PREFIX}prune norole`,
        footer: [`Type ${PREFIX}help prune for a specific action!`],
        //document: gitbook,
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
  onlyAdministrator: true,
  aliases: ["pr"],
}

export default command
