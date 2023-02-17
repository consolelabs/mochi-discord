import config from "adapters/config"
import defi from "adapters/defi"
import {
  ButtonInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { InternalError } from "errors"
import { Coin } from "types/defi"
import CacheManager from "cache/node-cache"
import { InteractionHandler } from "handlers/discord/select-menu"
import { renderChartImage } from "ui/canvas/chart"
import { getEmoji } from "utils/common"
import { getDefaultSetter } from "utils/default-setters"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { composeDaysSelectMenu } from "ui/discord/select-menu"
import { composeDiscordExitButton } from "ui/discord/button"
import { getChartColorConfig } from "ui/canvas/color"

export async function renderCompareTokenChart({
  times,
  ratios,
  chartLabel,
}: {
  times: string[]
  ratios: number[]
  chartLabel: string
}) {
  if (!times || !times.length) return null
  const image = await renderChartImage({
    chartLabel,
    labels: times,
    data: ratios,
  })

  return new MessageAttachment(image, "chart.png")
}

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const input = interaction.values[0]
  const [baseId, targetId, days] = input.split("_")
  if (!message.guildId) {
    return { messageOptions: { embeds: [getErrorEmbed({ msg: message })] } }
  }
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `compare-${message.guildId}-${baseId}-${targetId}-${days}`,
    call: () =>
      defi.compareToken(message.guildId ?? "", baseId, targetId, +days),
  })
  if (!ok) {
    await message.removeAttachments()
    return {
      messageOptions: { embeds: [getErrorEmbed({ msg: message })] },
    }
  }

  const { times, ratios, from, to } = data
  const chart = await renderCompareTokenChart({
    times,
    ratios,
    chartLabel: `Price ratio | ${from} - ${to}`,
  })

  // update chart image
  await message.removeAttachments()
  const [embed] = message.embeds
  embed.setImage("attachment://chart.png")

  const selectMenu = message.components[0].components[0] as MessageSelectMenu
  const choices = ["1", "7", "30", "90", "180", "365"]
  selectMenu.options.forEach(
    (opt, i) => (opt.default = i === choices.indexOf(days))
  )

  return {
    messageOptions: {
      embeds: [embed],
      ...(chart && { files: [chart] }),
      components: message.components as MessageActionRow[],
    },
    interactionOptions: {
      handler,
    },
  }
}

async function suggest(
  bases: any[],
  targets: any[],
  baseQ: string,
  targetQ: string
) {
  const options = bases
    .map((base: any) =>
      targets.map((target: any) => {
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
      const [baseId, baseSymbol, baseName, targetId, targetSymbol, targetName] =
        i.customId.split("_")

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
            CacheManager.findAndRemove(args[0], args[1])
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

export async function composeTokenComparisonEmbed(
  msg: Message,
  baseQ: string,
  targetQ: string
) {
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `compare-${msg.guildId}-${baseQ}-${targetQ}-30`,
    call: () => defi.compareToken(msg.guildId ?? "", baseQ, targetQ, 30),
  })
  if (!ok) {
    throw new InternalError({
      title: "Unsupported token/fiat",
      message: msg,
      description: `Token is invalid or hasn't been supported.\n${getEmoji(
        "POINTING_RIGHT"
      )} Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).\n${getEmoji(
        "POINTING_RIGHT"
      )} or Please choose a valid fiat currency.`,
    })
  }

  const { base_coin_suggestions, target_coin_suggestions } = data
  // multiple resutls found
  if (base_coin_suggestions || target_coin_suggestions) {
    return suggest(
      base_coin_suggestions,
      target_coin_suggestions,
      baseQ,
      targetQ
    )
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

  const embed = composeEmbedMessage(msg, {
    color: getChartColorConfig().borderColor as HexColorString,
    author: [`${base_coin.name} vs. ${target_coin.name}`],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
    description: `**Ratio**: \`${currentRatio}\``,
  }).addFields([
    { name: base_coin.name, value: coinInfo(base_coin), inline: true },
    { name: target_coin.name, value: coinInfo(target_coin), inline: true },
  ])

  const chart = await renderCompareTokenChart({
    times,
    ratios,
    chartLabel: `Price ratio | ${from} - ${to}`,
  })
  const selectRow = composeDaysSelectMenu(
    "compare_token_selection",
    `${baseQ}_${targetQ}`,
    [1, 7, 30, 90, 180, 365],
    30
  )

  return {
    messageOptions: {
      ...(chart && { files: [chart] }),
      embeds: [embed],
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    interactionOptions: {
      handler,
    },
  }
}
