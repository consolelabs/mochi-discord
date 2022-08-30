import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import track from "./track"
import list from "./list"
import remove from "./remove"

const actions: Record<string, Command> = {
  track,
  list,
  remove,
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
        description: "Receive real-time notification whenever there is a sale",
        footer: [`Type ${PREFIX}help sales <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  colorType: "Marketplace",
  canRunWithoutAction: false,
  aliases: ["sale"],
}

export default command
