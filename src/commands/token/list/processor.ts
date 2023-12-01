import { Token } from "types/defi"
import defi from "adapters/defi"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"

export async function handleTokenList(page = 0, size = 15) {
  const {
    data: response,
    ok,
    curl,
    error,
    log,
    status = 500,
  } = await defi.getUserSupportTokens(page, size)
  if (!ok) {
    throw new APIError({ curl, error, description: log, status })
  }
  if (!response?.data?.length)
    return {
      embed: composeEmbedMessage(null, {
        title: "No token found",
        description: `${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true,
        )} To add more token to the list, use \`$token add\``,
        color: msgColors.SUCCESS,
      }),
      totalPages: 1,
    }
  const { data, metadata } = response
  const total = metadata?.total ?? 1
  const totalPages = Math.ceil(total / size)
  const description = data
    .map((token: Token, idx: number) => {
      const { name, symbol } = token
      const tokenIdx = idx + size * page + 1
      return `${tokenIdx} . ${name} \`${symbol}\``
    })
    .join("\n")
  const embed = composeEmbedMessage(null, {
    thumbnail: getEmojiURL(emojis.TOKEN_LIST),
    author: ["Token List", getEmojiURL(emojis.PAWCOIN)],
    description: description,
    color: msgColors.ACTIVITY,
    footer: [`Page ${page + 1}/${totalPages}`],
  })

  return {
    embed,
    totalPages,
  }
}
