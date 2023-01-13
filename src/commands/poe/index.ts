import { Command } from "types/common"
import { PREFIX, TWITTER_WATCH_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import twitter from "./twitter"

const subCategories: Record<string, Command> = {
  twitter,
}

const textCmd: Command = {
  id: "poe",
  command: "poe",
  brief: "Proof of Engagement",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe <twitter>`,
        description: "Configure your server's PoE to drive engagement",
        examples: `${PREFIX}poe twitter set #general #mochitag,@Mochi Bot`,
        document: TWITTER_WATCH_GITBOOK,
        footer: [`Type ${PREFIX}help poe <action> for a specific action!`],
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
  actions: subCategories,
  canRunWithoutAction: false,
}

export default { textCmd }
