import { CommandInteraction, Message } from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { composeNFTListEmbed } from "./processor"
// import { listenForPaginateAction } from "handlers/discord/button"
import { reply } from "utils/discord"

const command: Command = {
  id: "nft_list",
  command: "list",
  brief: "Show list of supported NFTs",
  category: "Community",
  run: async function (msgOrInteraction: Message | CommandInteraction) {
    const msg =
      msgOrInteraction instanceof Message ? msgOrInteraction : undefined
    const response = await composeNFTListEmbed(msg, 0)
    await reply(msgOrInteraction, response)
    // listenForPaginateAction(replyMsg, msg, composeNFTListEmbed, true)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
