import defi from "adapters/defi"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"

export async function render() {
  const {
    data,
    ok,
    curl,
    error,
    log,
    status = 500,
  } = await defi.getTrendingSearch()
  if (!ok) {
    throw new APIError({ curl, error, description: log, status })
  }
  if (!data || data.coins.length === 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No trending search now!",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Currently no token found`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }
  }

  const description = data.coins
    .map((coin: any) => {
      return `${coin.item.name} (${coin.item.symbol}) #${coin.item.market_cap_rank}`
    })
    .join("\n")

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    description,
    author: ["Trending Search", getEmojiURL(emojis.ANIMATED_FIRE)],
  })

  return { messageOptions: { embeds: [embed] } }
}
