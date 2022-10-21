import { Command } from "types/common"
import { PREFIX, PRUNE_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import inactive from "./inactive"
import without from "./without"
import safelist from "./whitelist"
import remove from "./remove"

const actions: Record<string, Command> = {
  inactive,
  without,
  safelist,
  remove,
}

const command: Command = {
  id: "prune",
  command: "prune",
  brief: "Remove a group of users",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}prune <option>`,
        description: "Remove a group of users",
        examples: `${PREFIX}prune inactive 7\n${PREFIX}prune safelist @role1`,
        footer: [`Type ${PREFIX}help prune for a specific action!`],
        document: PRUNE_GITBOOK,
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
