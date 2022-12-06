import config from "adapters/config"
import defi from "adapters/defi"
import { Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { Command } from "types/common"
import CacheManager from "utils/CacheManager"
import { getCommandArguments } from "utils/commands"
import { defaultEmojis, thumbnails } from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX, TICKER_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"

async function setDefaultTicker(
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

const command: Command = {
  id: "ticker_default",
  command: "default",
  brief: "Default ticker",
  onlyAdministrator: true,
  category: "Defi",
  run: async function (msg) {
    const query = getCommandArguments(msg)[2]
    const { data: coins, ok, curl, log } = await defi.searchCoins(query)
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }
    if (!coins.length) {
      throw new InternalError({
        title: "Invalid symbol",
        message: msg,
        description: `${defaultEmojis.POINT_RIGHT} Cannot find any cryptocurrency with \`${query}\`.\n${defaultEmojis.POINT_RIGHT} Please choose one in our supported \`$token list\`!`,
      })
    }
    return {
      select: {
        options: Object.values(coins).map((coin: any) => {
          return {
            label: `${coin.name} (${coin.symbol.toUpperCase()})`,
            value: `${coin.id}_${coin.symbol}_${coin.name}`,
          }
        }),
        placeholder: "Select a token",
      },
      render: async ({ msgOrInteraction: msg, value }) => {
        const [coinId, symbol, name] = value.split("_")
        return setDefaultTicker(msg, coinId, symbol, name)
      },
      ambiguousResultText: query.toUpperCase(),
      multipleResultText: Object.values(coins)
        .map((c: any) => `**${c.name}** (${c.symbol.toUpperCase()})`)
        .join(", "),
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        description: `Set default ticker for current server`,
        usage: `${PREFIX}ticker default <symbol>`,
        examples: `${PREFIX}ticker default ftm`,
        document: TICKER_GITBOOK,
        footer: [DEFI_DEFAULT_FOOTER],
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
