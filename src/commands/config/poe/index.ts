import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import twitter from "./twitter"

const subCategories: Record<string, Command> = {
  twitter,
}

const command: Command = {
  id: "poe",
  command: "poe",
  brief: "Proof of Engagement",
  category: "Config",
  onlyAdministrator: true,
  run: () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe <twitter>`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
  actions: subCategories,
  canRunWithoutAction: false,
}

export default command
