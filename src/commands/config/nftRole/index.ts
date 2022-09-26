import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { NFT_ROLE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import list from "./list"
import remove from "./remove"
import set from "./set"

const actions: Record<string, Command> = {
  list,
  remove,
  set,
}

const command: Command = {
  id: "nftrole",
  command: "nftrole",
  brief: "NFT Role configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async () => null,
  featured: {
    title: `${getEmoji("")} NFT role`,
    description:
      "Asssign role to a user once they hold a certain amount of NFT\nSupports multiple collections and grouping",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nr <action>\n${PREFIX}nftrole <action>`,
        description:
          "Asssign role to a user once they hold a certain amount of NFT\nSupports multiple collections and grouping",
        examples: `${PREFIX}nr list\n${PREFIX}nftrole list`,
        footer: [`Type ${PREFIX}help nr <action> for a specific action!`],
        includeCommandsList: true,
        document: NFT_ROLE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["nr"],
  actions,
  colorType: "Server",
  minArguments: 4,
}

export default command
