import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import sales from "./sales"

const actions: Record<string, Command> = {
  sales,
}

const command: Command = {
  id: "track",
  command: "track",
  brief: "NFT track",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sales <action>`,
        footer: [`Type ${PREFIX}help sale <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Marketplace",
  canRunWithoutAction: false,
}

export default command
