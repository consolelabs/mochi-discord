import { Command } from "types/common"
import { Token } from "types/defi"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../../adapters/config"
import chunk from "lodash/chunk"

const command: Command = {
  id: "list_server_token",
  command: "list",
  brief: "View your server's tokens list",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const rawData = await Config.getGuildTokens(msg.guildId)
    if (!rawData || !rawData.length)
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "No token found",
              description: `Use \`${PREFIX}token add\` to add one to your server.`,
            }),
          ],
        },
      }
    const data = rawData.map((token: Token) => {
      const tokenEmoji = getEmoji(token.symbol)
      return `${tokenEmoji} **${token.symbol.toUpperCase()}**`
    })

    const fields = chunk(chunk(data, 10), 3).flatMap((row, i) => {
      return row.flatMap((c) => ({
        name: "\u200b",
        value: c.join("\n"),
        inline: i !== 2,
      }))
    })

    return {
      messageOptions: {
        embeds: [
          {
            color: "#77b255",
            title: ":dollar: Tokens list",
            fields,
          },
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens list`,
        examples: `${PREFIX}tokens list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
