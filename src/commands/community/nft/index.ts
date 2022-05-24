import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { executeNftAddCommand } from "./add"
import { executeNftCollection } from "./query-nft"
// import { API_BASE_URL } from "utils/constants"
// import fetch from "node-fetch"
// import { getEmoji } from "utils/common"

export const buildDiscordMessage = (
  msg: Message,
  title: string,
  description: string
) => {
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: title,
          description: description
        })
      ],
      components: [] as any[]
    }
  }
}

const command: Command = {
  id: "nft",
  command: "nft",
  brief: "Cyber Neko",
  category: "Community",
  run: async function(msg, action) {
    // get argument from command
    let args = getCommandArguments(msg)
    // run $nft add command
    if (args[1] == "add") {
      if (args.length < 4 && args.length >= 2) {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
      return executeNftAddCommand(args, msg)
    } else {
      // currently run $nft neko 1
      if (args.length < 3) {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
      return executeNftCollection(args, msg)
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft <symbol_collection> <token_id>\n${PREFIX}nft add <address> <chain>`,
        footer: [`Type ${PREFIX}help nft`],
        examples: `${PREFIX}nft neko 1\n${PREFIX}nft add 0xabcd eth`
      })
    ]
  }),
  canRunWithoutAction: true
}

export default command
