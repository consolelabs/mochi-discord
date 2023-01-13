import config from "adapters/config"
import { Message } from "discord.js"
import { APIError } from "errors"
import CacheManager from "cache/node-cache"
import { getSuccessEmbed } from "ui/discord/embed"

export async function setDefaultTicker(
  msg: Message,
  coinId: string,
  symbol: string,
  name: string
) {
  const { ok, curl, log } = await config.setGuildDefaultTicker({
    guild_id: msg.guildId ?? "",
    default_ticker: coinId,
    query: symbol,
  })
  if (!ok) {
    throw new APIError({ message: msg, curl: curl, description: log })
  }
  CacheManager.findAndRemove(
    "ticker",
    `ticker-default-${msg.guildId}-${symbol}`
  )
  CacheManager.findAndRemove("ticker", `compare-${msg.guildId}`, `-${symbol}-`)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg,
          description: `Next time your server members use \`$ticker\` with \`${symbol}\`, **${name}** will be the default selection.`,
        }),
      ],
      components: [],
    },
  }
}
