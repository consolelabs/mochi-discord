import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX, TELEGRAM_GITBOOK } from "utils/constants"
import config from "./config"

const actions: Record<string, Command> = {
  config,
}

const command: Command = {
  id: "telegram",
  command: "telegram",
  brief: "Telegram configuration",
  category: "Config",
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Telegram configuration",
        description: "Manage your linked Telegram account",
        usage: `${PREFIX}telegram <action>`,
        examples: `${PREFIX}telegram config\n${PREFIX}telegram config anhnhhhh`,
        document: TELEGRAM_GITBOOK,
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
