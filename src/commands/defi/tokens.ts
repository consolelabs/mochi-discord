import { Command } from "types/common"
import { getEmoji, getHeader, thumbnails } from "utils/common"
import Defi from "adapters/defi"
import { composeEmbedMessage } from "utils/discordEmbed"
import { PREFIX } from "utils/constants"

const command: Command = {
  id: "tokens",
  command: "tokens",
  brief: "Check the list of supported tokens",
  category: "Defi",
  run: async function (msg) {
    let description = ""
    const supportedTokens = await Defi.getSupportedTokens()
    for (const token of supportedTokens) {
      const tokenEmoji = getEmoji(token.symbol)
      description += `${tokenEmoji} **${token.symbol.toUpperCase()}**\n`
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Supported tokens"],
            description,
          }),
        ],
        content: getHeader("View all supported tokens", msg.author),
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        usage: `${PREFIX}tokens`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["token", "tkn", "tk"],
}

export default command
