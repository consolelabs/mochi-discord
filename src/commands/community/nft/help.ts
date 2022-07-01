import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import handlePrefixedCommand from "commands"

const command: Command = {
  id: "nft_help",
  command: "help",
  brief: "Show commands for nft",
  category: "Community",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length > 2) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    msg.content = "$help nft"
    const embed = await handlePrefixedCommand(msg)
    return embed
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft help`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
