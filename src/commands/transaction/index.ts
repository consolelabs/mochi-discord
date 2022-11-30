import { Command } from "types/common"
import { getEmoji, thumbnails } from "utils/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX, TRANSACTION_GITBOOK } from "utils/constants"
import track from "./track"
import list from "./list"
import remove from "./remove"

const actions: Record<string, Command> = {
  track,
  list,
  remove,
}

const command: Command = {
  id: "transaction",
  command: "transaction",
  brief: "Tracking transaction",
  category: "Defi",
  run: async () => null,
  featured: {
    title: `${getEmoji("search")} Tracking Transaction`,
    description: "Store all transaction activities in one channel",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Manage your transaction log",
        description: "Store all transaction activities in one channel",
        usage: `${PREFIX}transaction <action>\n${PREFIX}tx <action>`,
        examples: `${PREFIX}transaction list\n${PREFIX}tx track ftm #general`,
        document: TRANSACTION_GITBOOK,
        footer: [
          `Type ${PREFIX}help transaction <action> for a specific action!.`,
        ],
        includeCommandsList: true,
      }),
    ],
  }),
  canRunWithoutAction: false,
  colorType: "Defi",
  minArguments: 2,
  actions,
  aliases: ["tx"],
}

export default command
