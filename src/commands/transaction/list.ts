import { composeEmbedMessage } from "utils/discordEmbed"
import { Command } from "types/common"
import { getEmoji, thumbnails } from "utils/common"
import { PREFIX } from "utils/constants"
import Defi from "adapters/defi"
import { APIError } from "errors/APIError"
import { GuildIdNotFoundError } from "errors/GuildIdNotFoundError"

const command: Command = {
  id: "transaction_list",
  command: "list",
  brief: "Show the list of all transaction tracker",
  category: "Defi",
  run: async (msg) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const { data, ok, error, curl, log } =
      await Defi.getListConfigNofityTransaction({ guild_id: msg.guildId })

    if (!ok) {
      throw new APIError({ message: msg, curl, description: log, error })
    }

    if (data.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: `${getEmoji("TRANSACTIONS")} Transaction tracker`,
              description: `There's not any transaction yet.`,
            }),
          ],
        },
      }
    }

    const embed = data
      .map((config: any) => {
        const token =
          config.token.toUpperCase() == "*"
            ? "All tokens"
            : config.token.toUpperCase()
        return `<#${config.channel_id}>\n${getEmoji("reply")} ${token} | ${
          config.total_transaction
        } transactions`
      })
      .join("\n")

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: `${getEmoji("TRANSACTIONS")} Transaction tracker`,
            description: embed,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Show list of your favorite tokens",
        description: `Data is fetched from [CoinGecko](https://coingecko.com/)`,
        usage: `${PREFIX}transaction list`,
        examples: `${PREFIX}transaction list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
