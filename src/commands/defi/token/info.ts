import defi from "adapters/defi"
import { HexColorString, Message } from "discord.js"
import { APIError, InternalError, GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import CacheManager from "utils/CacheManager"
import { getChartColorConfig } from "utils/canvas"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import TurnDown from "turndown"
import config from "adapters/config"
import { getDefaultSetter } from "utils/default-setters"

async function composeTokenInfoResponse({
  msg,
  coinId,
}: {
  msg: Message
  coinId: string
}) {
  const {
    ok,
    data: coin,
    log,
    curl,
  } = await CacheManager.get({
    pool: "ticker",
    key: `ticker-getcoin-${coinId}`,
    call: () => defi.getCoin(coinId),
  })
  if (!ok) {
    throw new APIError({ message: msg, curl, description: log })
  }
  const embed = composeEmbedMessage(msg, {
    thumbnail: coin.image.large,
    color: getChartColorConfig(coin.id).borderColor as HexColorString,
    title: "About " + coin.name,
    footer: ["Data fetched from CoinGecko.com"],
  })
  const tdService = new TurnDown()
  const content = coin.description.en
    .split("\r\n\r\n")
    .map((v: any) => {
      return tdService.turndown(v)
    })
    .join("\r\n\r\n")
  embed.setDescription(content || "This token has not updated description yet")
  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}

const command: Command = {
  id: "info_server_token",
  command: "info",
  brief: "Information of a token",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const [token] = args.slice(2)
    const {
      ok,
      data: coins,
      log,
      curl,
    } = await CacheManager.get({
      pool: "ticker",
      key: `ticker-search-${token}`,
      call: () => defi.searchCoins(token),
    })
    if (!ok) throw new APIError({ message: msg, curl, description: log })
    if (!coins || !coins.length) {
      throw new InternalError({
        message: msg,
        description: `Cannot find any cryptocurrency with \`${token}\`.\nPlease choose another one!`,
      })
    }
    if (coins.length === 1) {
      return await composeTokenInfoResponse({ msg, coinId: coins[0].id })
    }
    // if default was set then respond...
    const { symbol } = coins[0]
    const defaultToken = await CacheManager.get({
      pool: "ticker",
      key: `ticker-default-${msg.guildId}-${symbol}`,
      call: () =>
        config.getGuildDefaultTicker({
          guild_id: msg.guildId ?? "",
          query: symbol,
        }),
    })
    if (defaultToken.ok && defaultToken.data.default_ticker) {
      return await composeTokenInfoResponse({
        msg,
        coinId: defaultToken.data.default_ticker,
      })
    }

    // else render embed to show multiple results
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
      onDefaultSet: async (i) => {
        const [coinId, symbol, name] = i.customId.split("_")
        getDefaultSetter({
          updateAPI: config.setGuildDefaultTicker.bind(config, {
            guild_id: i.guildId ?? "",
            query: symbol,
            default_ticker: coinId,
          }),
          updateCache: CacheManager.findAndRemove.bind(
            CacheManager,
            "ticker",
            `ticker-default-${i.guildId}-${symbol}`
          ),
          description: `Next time your server members use \`$token info\` with \`${symbol}\`, **${name}** will be the default selection`,
        })(i)
      },
      render: ({ msgOrInteraction: msg, value }) => {
        const [coinId] = value.split("_")
        return composeTokenInfoResponse({ msg, coinId })
      },
      ambiguousResultText: token.toUpperCase(),
      multipleResultText: Object.values(coins)
        .map((c: any) => `**${c.name}** (${c.symbol.toUpperCase()})`)
        .join(", "),
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tokens info <symbol>\n${PREFIX}tokens info <id>`,
        examples: `${PREFIX}tokens info eth\n${PREFIX}tokens info ethereum`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  minArguments: 3,
  colorType: "Defi",
}

export default command
