import { Command } from "types/common"
import { Token } from "types/defi"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "list_server_token",
  command: "list",
  brief: "View your server's tokens list",
  category: "Community",
  run: async msg => {
    const data = await Config.getGuildTokens(msg.guildId)
    const description = data
      .map((token: Token) => {
        const tokenEmoji = getEmoji(token.symbol)
        return `${tokenEmoji} **${token.symbol.toUpperCase()}**`
      })
      .join("\n")
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [`${msg.guild.name}'s tokens list`, msg.guild.iconURL()],
            description
          })
        ]
      }
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens list`,
        examples: `${PREFIX}tokens list`
      })
    ]
  }),
  canRunWithoutAction: true
}

export default command
