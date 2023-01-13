import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { handleNftVolume } from "./processor"

const command: Command = {
  id: "top_nft",
  command: "volume",
  brief: "Show top NFT volume",
  category: "Community",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length > 2) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    return await handleNftVolume(msg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft volume`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
