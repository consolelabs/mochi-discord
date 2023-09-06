import config from "adapters/config"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError, InternalError } from "errors"
import { getEmoji } from "utils/common"
import CacheManager from "cache/node-cache"
import defi from "adapters/defi"
import { getSuccessEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export async function runDefaultTicker(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    throw new GuildIdNotFoundError({ message: interaction })
  }

  // get symbol and validate if we support or not
  const symbol = interaction.options.getString("symbol", true)
  const default_ticker = interaction.options.getString("default", true)
  const { data: coins } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-search-${symbol}`,
    call: () => defi.searchCoins(symbol, ""),
  })
  if (!coins || !coins.length) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      msgOrInteraction: interaction,
      description: `**${symbol.toUpperCase()}** is invalid or hasn't been supported.\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} or Please choose a valid fiat currency.`,
    })
  }

  const { ok } = await config.setGuildDefaultTicker({
    guild_id: interaction.guildId ?? "",
    default_ticker,
    query: symbol,
  })
  if (!ok) {
    throw new InternalError({
      title: "Cannot set default ticker",
      msgOrInteraction: interaction,
      description: `Please try again later.`,
    })
  }

  const embeds = getSuccessEmbed({
    description: `Next time your server members use ${await getSlashCommand(
      "ticker",
    )}, **${default_ticker}** will be the default selection.`,
  })

  return {
    messageOptions: {
      embeds: [embeds],
    },
  }
}
