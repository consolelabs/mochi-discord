import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import track from "./track"

const actions: Record<string, Command> = {
  track,
}

const command: Command = {
  id: "sales",
  command: "sales",
  brief: "NFT sales tracker",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}sales <action>`,
        footer: [`Type ${PREFIX}help sales <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Marketplace",
  canRunWithoutAction: false,
}

export default command
