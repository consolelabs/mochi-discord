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

  const { data, ok, curl, error, log } = await defi.getAllCoinsMarketData({
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
            title: "No gainer token now!",
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

  let longestStrLen = 0
  const description = data
    .slice(0, 10)
    .map((coin: any) => {
      const changePercentage = roundFloatNumber(
        coin[`price_change_percentage_${timeRange}_in_currency`],
        2
      )

      const text = `${coin.name} (${coin.symbol})`
      longestStrLen = Math.max(longestStrLen, text.length)
      const currentPrice = roundFloatNumber(coin.current_price, 4)

      return {
        text,
        changePercentage,
        current_price: currentPrice,
      }
    })
    .map((coin: any) => {
      return `\`${coin.text}${" ".repeat(
        longestStrLen - coin.text.length
      )} => $${coin.current_price}. Change: ${coin.changePercentage}%\``
    })
    .join("\n")

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    description,
    author: ["Top gainers", getEmojiURL(emojis.ANIMATED_FIRE)],
  })

  return { messageOptions: { embeds: [embed] } }
}
