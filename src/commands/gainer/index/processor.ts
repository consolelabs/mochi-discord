import defi from "adapters/defi"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
} from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"

export async function render(i: CommandInteraction) {
  const timeRange = i.options.getString("time", true)

  const { data, ok, curl, error, log } = await defi.getCoinsMarketData({
    order: `price_change_percentage_${timeRange}_desc`,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (data.length === 0) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No loser token now!",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} Currently no token found`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }
  }

  const description = data
    .slice(0, 5)
    .map((coin: any) => {
      return `${coin.name} (${coin.symbol}) #${
        coin.market_cap_rank
      }\nChange: ${roundFloatNumber(
        coin[`price_change_percentage_${timeRange}_in_currency`],
        2
      )}%\n`
    })
    .join("\n")

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    description,
    author: ["Top gainers", getEmojiURL(emojis.ANIMATED_FIRE)],
  })

  return { messageOptions: { embeds: [embed] } }
}
