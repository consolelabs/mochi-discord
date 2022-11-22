import { Command } from "types/common"
import {
  ButtonInteraction,
  HexColorString,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { getCommandArguments } from "utils/commands"
import {
  composeDiscordExitButton,
  composeEmbedMessage,
  getErrorEmbed,
  composeDaysSelectMenu,
} from "utils/discordEmbed"
import defi from "adapters/defi"
import { getChartColorConfig, renderChartImage } from "utils/canvas"
import { Coin } from "types/defi"
import config from "adapters/config"
import CacheManager from "utils/CacheManager"
import { InteractionHandler } from "utils/InteractionManager"
import { getDefaultSetter } from "utils/default-setters"
import comparefiat from "./compare_fiat"
import { CommandArgumentError } from "errors"

export const allowedFiats = ["gbp", "usd", "eur", "sgd", "vnd"]

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

const handler: InteractionHandler = async (msgOrInteraction) => {
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

async function composeTokenComparisonEmbed(
  msg: Message,
  baseQ: string,
  targetQ: string
) {
  if (!msg.guildId) {
    return {
      messageOptions: { embeds: [getErrorEmbed({ msg })] },
    }
  }
  const { ok, data } = await CacheManager.get({
    pool: "ticker",
    key: `compare-${msg.guildId}-${baseQ}-${targetQ}-7`,
    call: () => defi.compareToken(msg.guildId ?? "", baseQ, targetQ, 7),
  })
  if (!ok) {
    return {
      messageOptions: { embeds: [getErrorEmbed({ msg })] },
    }
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

  const embed = composeEmbedMessage(msg, {
    color: getChartColorConfig().borderColor as HexColorString,
    author: [`${base_coin.name} vs. ${target_coin.name}`],
    footer: ["Data fetched from CoinGecko.com"],
    image: "attachment://chart.png",
    description: `**Ratio**: \`${currentRatio}\``,
  })
    .addField(base_coin.name, coinInfo(base_coin), true)
    .addField(target_coin.name, coinInfo(target_coin), true)

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
      components: [selectRow, composeDiscordExitButton(msg.author.id)],
    },
    interactionOptions: {
      handler,
    },
  }
}

const command: Command = {
  id: "ticker_compare",
  command: "compare",
  brief: "View comparison between 2 tokens",
  category: "Defi",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const [query] = args.slice(1)
    const [base, target] = query.split("/")

    const isFiat =
      allowedFiats.includes(base.toLowerCase()) || base.length === 6
    // fiat comparision ...
    if (isFiat) return comparefiat.run(msg)

    if (base.toLowerCase() === target.toLowerCase()) {
      throw new CommandArgumentError({
        message: msg,
        description: "Base and target tokens cannot be the same",
        getHelpMessage: () => this.getHelpMessage(msg),
      })
    }
    // ... or token comparison
    return await composeTokenComparisonEmbed(msg, base, target)
  },
  getHelpMessage: async () => {
    return {}
  },
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
}

export default command
