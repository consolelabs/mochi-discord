import { RunResult } from "types/common"
import { Token } from "types/defi"
import { getEmoji, msgColors } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import Config from "../../../adapters/config"
import chunk from "lodash/chunk"
import { MessageOptions } from "discord.js"
import { APIError } from "errors"

export async function handleTokenList(
  guildId: string
): Promise<RunResult<MessageOptions>> {
  const { data: gTokens, ok, curl, log } = await Config.getGuildTokens(guildId)
  if (!ok) {
    throw new APIError({ curl, description: log })
  }
  if (!gTokens || !gTokens.length)
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
  const data = gTokens.map((token: Token) => {
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
          color: msgColors.PINK,
          title: `${getEmoji("TIP")} Tokens list`,
          fields,
        },
      ],
    },
  }
}
