import defi from "adapters/defi"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  thumbnails,
} from "utils/common"

export const enum RequestStatus {
  APPROVED = "approved",
  REJECTED = "rejected",
  PENDING = "pending",
}

export async function handleTokenList(page = 0, size = 15) {
  const {
    data: response,
    ok,
    curl,
    error,
    log,
  } = await defi.getUserSupportTokens(RequestStatus.APPROVED, page, size)
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!response?.data?.length)
    return {
      embed: composeEmbedMessage(null, {
        title: "No token found",
        description: `${getEmoji(
          "POINTINGRIGHT"
        )} To add more token to the list, use \`$token add\``,
        color: msgColors.SUCCESS,
      }),
      totalPages: 1,
    }
  const { data, metadata } = response
  const total = metadata?.total ?? 1
  const totalPages = Math.ceil(total / size)
  const description = data
    .map((token: any, idx: number) => {
      const { token_name, symbol } = token
      const tokenName = token_name ? token_name : "Unknown"
      const tokenSymbol = symbol ? symbol : "UNKNOWN"
      return `${idx + 1} . ${tokenName} \`${tokenSymbol}\``
    })
    .join("\n")
  const embed = composeEmbedMessage(null, {
    thumbnail: thumbnails.CUSTOM_TOKEN,
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
