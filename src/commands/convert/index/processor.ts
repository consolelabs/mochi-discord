import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { ButtonInteraction, CommandInteraction } from "discord.js"
import { InternalError } from "errors"
import { Coin } from "types/defi"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  TokenEmojiKey,
  getAuthor,
  getEmoji,
  getEmojiToken,
  msgColors,
} from "utils/common"
import config from "../../../adapters/config"
import { getDefaultSetter } from "../../../utils/default-setters"

export async function render(
  interaction: CommandInteraction,
  args: [string, number, string, string]
) {
  const amount = String(args[1])
  const baseQ = args[2]
  const targetQ = args[3]

  const { ok: compareTickerOk, data: compareTickerData } =
    await CacheManager.get({
      pool: "ticker",
      key: `compare-${interaction.guildId}-${baseQ}-${baseQ}-30`,
      call: () =>
        defi.compareToken(interaction.guildId ?? "", baseQ, targetQ, 30),
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

  const { base_coin_suggestions, target_coin_suggestions } = compareTickerData
  // multiple resutls found
  if (base_coin_suggestions || target_coin_suggestions) {
    return suggest(
      interaction,
      base_coin_suggestions,
      target_coin_suggestions,
      args
    )
  }

  const { ratios, base_coin, target_coin } = compareTickerData
  const currentRatio = ratios?.[ratios?.length - 1] ?? 0
  const coinInfo = (coin: Coin | null, emoji = true) =>
    `${emoji ? `${getEmoji("ANIMATED_TROPHY", true)}` : ""} Rank: \`#${
      coin?.market_cap_rank ?? "?"
    }\``
      .concat(
        `\n${emoji ? `${getEmoji("ANIMATED_COIN_2")}` : ""} Price: \`$${
          coin?.market_data?.current_price["usd"]?.toLocaleString() ?? "_"
        }\``
      )
      .concat(
        `\n${emoji ? ":ocean:" : ""} Market cap: \`$${
          coin?.market_data?.market_cap["usd"]?.toLocaleString() ?? "_"
        }\``
      )

  const from = base_coin.symbol.toUpperCase() as TokenEmojiKey
  const to = target_coin.symbol.toUpperCase() as TokenEmojiKey

  const blank = getEmoji("BLANK")
  const author = getAuthor(interaction)
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CONVERSION")} Conversion${blank.repeat(7)}`,
    description: `**${amount} ${from} ≈ ${
      currentRatio * +amount
    } ${to}**\n\n**Ratio**: \`${currentRatio}\`\n${getEmoji("LINE").repeat(
      10
    )}`,
    color: msgColors.MOCHI,
    originalMsgAuthor: author,
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

function suggest(
  i: CommandInteraction,
  baseSuggestions: any[],
  targetSuggestions: any[],
  args: [string, number, string, string]
) {
  const from = args[2].toUpperCase() as TokenEmojiKey
  const to = args[3].toUpperCase() as TokenEmojiKey

  const bases: Record<string, any> = baseSuggestions.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.id]: cur,
    }),
    {}
  )

  const targets: Record<string, any> = targetSuggestions.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.id]: cur,
    }),
    {}
  )

  const options = baseSuggestions
    .map((base: any) =>
      targetSuggestions.map((target: any) => {
        return {
          label: `${base.name} (${base.symbol.toUpperCase()}) x ${
            target.name
          } (${target.symbol.toUpperCase()})`,
          value: `${base.id}_${target.id}`,
        }
      })
    )
    .flat()
    .slice(0, 25)

  return {
    select: {
      options,
      placeholder: "Select a pair",
    },
    onDefaultSet: async (i: ButtonInteraction) => {
      const [baseId, targetId] = i.customId.split("_")
      const [base, target] = [bases[baseId], targets[targetId]]
      const { symbol: bSymbol, name: bName } = base
      const { symbol: tSymbol, name: tName } = target

      await getDefaultSetter({
        updateAPI: async () => {
          const tickers = [
            {
              guild_id: i.guildId ?? "",
              query: base.symbol,
              default_ticker: baseId,
            },
            {
              guild_id: i.guildId ?? "",
              query: target.symbol,
              default_ticker: targetId,
            },
          ]
          await Promise.all(tickers.map((p) => config.setGuildDefaultTicker(p)))
        },
        updateCache: () => {
          ;(<Array<[string, string]>>[
            ["ticker", `ticker-default-${i.guildId}-${bSymbol}`],
            ["ticker", `ticker-default-${i.guildId}-${tSymbol}`],
            ["ticker", `compare-${i.guildId}-${bSymbol}-${tSymbol}-`],
            ["ticker", `compare-${i.guildId}-${tSymbol}-${bSymbol}-`],
          ]).forEach((args) => {
            CacheManager.findAndRemove(args[0], args[1])
          })
        },
        description: `Next time your server members use \`$ticker\` with \`${bSymbol}\` and \`${tSymbol}\`, **${bName}** and **${tName}** will be the default selection`,
      })(i)
    },
    render: ({ value }: any) => {
      const [baseCoinId, targetCoinId] = value.split("_")
      return render(i, [args[0], args[1], baseCoinId, targetCoinId])
    },
    ambiguousResultText: `${from}/${to}`.toUpperCase(),
    multipleResultText: "",
  }
}
