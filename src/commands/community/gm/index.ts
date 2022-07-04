import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import config from "./config"
import streak from "./streak"
import info from "./info"

const actions: Record<string, Command> = {
  config,
  streak,
  info,
}

const command: Command = {
  id: "gm",
  command: "gm",
  brief: "GM/GN",
  category: "Community",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}gm <action>`,
        footer: [`Type ${PREFIX}help gm <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  aliases: ["gn"],
  actions,
  colorType: "Command",
  canRunWithoutAction: false,
}

export default command
