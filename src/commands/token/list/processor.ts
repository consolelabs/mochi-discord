import defi from "adapters/defi"
import { MessageOptions } from "discord.js"
import { APIError } from "errors"
import chunk from "lodash/chunk"
import { ModelOffchainTipBotToken } from "types/api"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"

export async function handleTokenList(): Promise<RunResult<MessageOptions>> {
  const { data, ok, curl, error, log } = await defi.getAllTipBotTokens()
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data.length)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No token found",
            description: `${getEmoji(
              "POINTINGRIGHT"
            )} To add more token to the list, use \`$token add\``,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  // currently available, remove when fully support
  const spTokens = ["ftm", "sol", "icy", "butt", "eth", "fbomb", "mclb"]
  const supportedToken = data.filter((token: ModelOffchainTipBotToken) => {
    return spTokens.includes((token.token_symbol ?? "").toLowerCase())
  })
  const tokens = supportedToken.map((token: ModelOffchainTipBotToken) => {
    const tokenEmoji = getEmoji(token.token_symbol ?? "")
    return `${tokenEmoji} **${(token.token_symbol ?? "").toUpperCase()}**`
  })

  const fields = chunk(chunk(tokens, 10), 3).flatMap((row, i) => {
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
          color: msgColors.PINK,
          title: `${getEmoji("TIP")} Tokens list`,
          fields,
        },
      ],
    },
  }
}
