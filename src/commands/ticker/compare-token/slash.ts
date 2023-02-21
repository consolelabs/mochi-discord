import config from "adapters/config"
import defi from "adapters/defi"
import {
  ButtonInteraction,
  CommandInteraction,
  HexColorString,
  SelectMenuInteraction,
} from "discord.js"
import { InternalError } from "errors"
import { Coin } from "types/defi"
import CacheManager from "cache/node-cache"
import { getEmoji } from "utils/common"
import { getDefaultSetter } from "utils/default-setters"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  renderCompareTokenChart,
  handler,
  composeTokenComparisonEmbed,
} from "./processor"
import { SlashCommandResponse } from "types/common"
import { getChartColorConfig } from "ui/canvas/color"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"

async function run(
  interaction: SelectMenuInteraction | CommandInteraction,
  baseQ: string,
  targetQ: string
): Promise<SlashCommandResponse> {
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `compare-${interaction.guildId}-${baseQ}-${targetQ}-7`,
    call: () => defi.compareToken(interaction.guildId ?? "", baseQ, targetQ, 7),
  })
  if (!ok) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      message: interaction,
      description: `Token is invalid or hasn't been supported.\n${getEmoji(
        "POINTINGRIGHT"
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "POINTINGRIGHT"
      )} or Please choose a valid fiat currency.`,
    })
  }

  const { base_coin_suggestions, target_coin_suggestions } = data

  // multiple resutls found
  if (base_coin_suggestions || target_coin_suggestions) {
    const options = base_coin_suggestions
      .map((base: any) =>
        target_coin_suggestions.map((target: any) => {
          return {
            label: `${base.name} (${base.symbol.toUpperCase()}) x ${
              target.name
            } (${target.symbol.toUpperCase()})`,
            value: `${base.id}_${base.symbol}_${base.name}_${target.id}_${target.symbol}_${target.name}`,
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
        const [
          baseId,
          baseSymbol,
          baseName,
          targetId,
          targetSymbol,
          targetName,
        ] = i.customId.split("_")

        getDefaultSetter({
          updateAPI: async () => {
            ;[
              {
                guild_id: i.guildId ?? "",
                query: baseSymbol,
                default_ticker: baseId,
              },
              {
                guild_id: i.guildId ?? "",
                query: targetSymbol,
                default_ticker: targetId,
              },
            ].forEach((p) => {
              config.setGuildDefaultTicker(p)
            })
          },
          updateCache: () => {
            ;(<Array<[string, string]>>[
              ["ticker", `ticker-default-${i.guildId}-${baseSymbol}`],
              ["ticker", `ticker-default-${i.guildId}-${targetSymbol}`],
              ["ticker", `compare-${i.guildId}-${baseSymbol}-${targetSymbol}-`],
              ["ticker", `compare-${i.guildId}-${targetSymbol}-${baseSymbol}-`],
            ]).forEach((args) => {
              CacheManager.findAndRemove.apply(null, args)
            })
          },
          description: `Next time your server members use \`$ticker\` with \`${baseSymbol}\` and \`${targetSymbol}\`, **${baseName}** and **${targetName}** will be the default selection`,
        })(i)
      },
      render: ({ msgOrInteraction: msg, value }: any) => {
        const [baseCoinId, , , targetCoinId] = value.split("_")
        return composeTokenComparisonEmbed(msg, baseCoinId, targetCoinId)
      },
      ambiguousResultText: `${baseQ}/${targetQ}`.toUpperCase(),
      multipleResultText: "",
    }
  }

  const coinInfo = (coin: Coin) =>
    `Rank: \`#${coin.market_cap_rank}\``
      .concat(
        `\nPrice: \`$${coin.market_data.current_price[
          "usd"
        ]?.toLocaleString()}\``
      )
      .concat(
        `\nMarket cap: \`$${coin.market_data.market_cap[
          "usd"
        ]?.toLocaleString()}\``
      )
  const { times, ratios, from, to, base_coin, target_coin } = data
  const currentRatio = ratios?.[ratios?.length - 1] ?? 0

  const embed = composeEmbedMessage(null, {
    color: getChartColorConfig().borderColor as HexColorString,
    author: [`${base_coin.name} vs. ${target_coin.name}`],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
    description: `**Ratio**: \`${currentRatio}\``,
  }).addFields(
    { name: base_coin.name, value: coinInfo(base_coin), inline: true },
    { name: target_coin.name, value: coinInfo(target_coin), inline: true }
  )

  const chart = await renderCompareTokenChart({
    times,
    ratios,
    chartLabel: `Price ratio | ${from} - ${to}`,
  })
  const selectRow = composeDaysSelectMenu(
    "compare_token_selection",
    `${baseQ}_${targetQ}`,
    [1, 7, 30, 90, 180, 365]
  )

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow, composeDiscordExitButton(interaction.user.id)],
    },
    interactionOptions: {
      handler,
    },
  }
}

export default run
