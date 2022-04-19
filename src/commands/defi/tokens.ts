import { Command } from "types/common"
import { getEmoji, getHeader, thumbnails } from "utils/common"
import Defi from "adapters/defi"
import { composeEmbedMessage } from "utils/discord-embed"

const command: Command = {
  id: "tokens",
  command: "tokens",
  name: "Tokens",
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
  getHelpMessage: async (msg) => {
    const embedMsg = composeEmbedMessage(msg, {
      thumbnail: thumbnails.TOKENS,
      description: `\`\`\`Check the list of supported tokens.\`\`\``,
    })
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["token", "tkn", "currency", "currencies", "cur", "curs"],
}

export default command
