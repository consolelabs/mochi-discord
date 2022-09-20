import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import config from "./config"

const actions: Record<string, Command> = {
  config,
}

const command: Command = {
  id: "telegram",
  command: "telegram",
  brief: "Manage your linked telegram account",
  category: "Config",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your linked telegram account",
        usage: `${PREFIX}telegram <action>`,
        examples: `${PREFIX}telegram config`,
        includeCommandsList: true,
      }),
    ],
  }),
  actions,
  aliases: ["tel"],
  canRunWithoutAction: false,
  colorType: "Profile",
  minArguments: 2,
}

export default command
