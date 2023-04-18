import defi from "adapters/defi"
import { getEmoji, getEmojiToken, msgColors, TokenEmojiKey } from "utils/common"
import { CommandInteraction, Message } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError, InternalError } from "errors"
import { Coin } from "types/defi"
import CacheManager from "cache/node-cache"

export async function render(
  msgOrInteraction: Message | CommandInteraction,
  args: [string, number, string, string]
) {
  const amount = String(args[1])
  const from = args[2].toUpperCase() as TokenEmojiKey
  const to = args[3].toUpperCase() as TokenEmojiKey

  const { data, ok, curl, error, log } = await defi.convertToken({
    from,
    to,
    amount,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data) {
    return {
      messageOptions: {
        embed: composeEmbedMessage(null, {
          title: "Cannot conver token",
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} This user does not have any activities yet`,
          color: msgColors.ERROR,
        }),
      },
    }
  }

  const { ok: compareTickerOk, data: compareTickerData } =
    await CacheManager.get({
      pool: "ticker",
      key: `compare-${msgOrInteraction.guildId}-${from}-${to}-30`,
      call: () =>
        defi.compareToken(msgOrInteraction.guildId ?? "", from, to, 30),
    })

  if (!compareTickerOk) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      description: `Token is invalid or hasn't been supported.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} or Please choose a valid fiat currency.`,
    })
  }

  const { ratios, base_coin, target_coin } = compareTickerData
  const currentRatio = ratios?.[ratios?.length - 1] ?? 0
  const coinInfo = (coin: Coin, emoji = true) =>
    `${emoji ? `${getEmoji("ANIMATED_TROPHY", true)}` : ""} Rank: \`#${
      coin.market_cap_rank
    }\``
      .concat(
        `\n${
          emoji ? `${getEmoji("ANIMATED_COIN_2")}` : ""
        } Price: \`$${coin.market_data.current_price[
          "usd"
        ]?.toLocaleString()}\``
      )
      .concat(
        `\n${
          emoji ? ":ocean:" : ""
        } Market cap: \`$${coin.market_data.market_cap[
          "usd"
        ]?.toLocaleString()}\``
      )

  const blank = getEmoji("BLANK")
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CONVERSION")} Conversion${blank.repeat(7)}`,
    description: `**${amount} ${from} ≈ ${
      data.to.amount
    } ${to}**\n\n**Ratio**: \`${currentRatio}\`\n${getEmoji("LINE").repeat(
      10
    )}`,
    color: msgColors.MOCHI,
  }).addFields([
    {
      name: `${getEmoji("BLANK")}${getEmojiToken(from)} ${from}`,
      value: coinInfo(base_coin),
      inline: true,
    },
    {
      name: `${getEmojiToken(to)} ${to}`,
      value: coinInfo(target_coin, false),
      inline: true,
    },
  ])

  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}
