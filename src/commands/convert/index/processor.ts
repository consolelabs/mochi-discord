import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import { aggregateTradeRoute } from "commands/swap/index/aggregate-util"
import {
  renderRouteEmbed,
  SLIPPAGE,
  TradeRouteDataCode,
} from "commands/swap/index/processor"
import { renderTokenComparisonFields } from "commands/ticker/index/processor"
import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { InternalError } from "errors"
import { BigNumber, utils } from "ethers"
import { composeEmbedMessage } from "ui/discord/embed"
import { capitalizeFirst, getAuthor, getEmoji, msgColors } from "utils/common"
import { APPROX } from "utils/constants"
import { formatTokenDigit, formatUsdDigit } from "utils/defi"
import { getProfileIdByDiscord } from "utils/profile"

export async function render(
  interaction: CommandInteraction | ButtonInteraction,
  from: string,
  to: string,
  amount: number
) {
  const profileId = await getProfileIdByDiscord(interaction.user.id)

  let compareTickerData
  const { ok: compareTickerOk, data } = await CacheManager.get({
    pool: "ticker",
    key: `compare-${interaction.guildId}-${from}-${to}-30`,
    call: () => defi.compareToken(interaction.guildId ?? "", from, to, 30),
  })

  if (!compareTickerOk) {
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Unsupported token",
      descriptions: [
        "Please choose a token that is listed on [CoinGecko](https://www.coingecko.com).",
        "Or choose a valid fiat currency.",
      ],
      reason: `**${from}** or **${to}** hasn't been supported.`,
    })
  }

  const { base_coin_suggestions, target_coin_suggestions } = data
  if (base_coin_suggestions.length || target_coin_suggestions.length) {
    const baseCoin = base_coin_suggestions.find((c: any) => c.most_popular).id
    const targetCoin = target_coin_suggestions.find(
      (c: any) => c.most_popular
    ).id
    const { data } = await CacheManager.get({
      pool: "ticker",
      key: `compare-${interaction.guildId}-${baseCoin}-${targetCoin}-30`,
      call: () =>
        defi.compareToken(interaction.guildId ?? "", baseCoin, targetCoin, 30),
    })

    if (data) {
      compareTickerData = data
    }
  }

  const { ratios, base_coin, target_coin } = compareTickerData
  const comparisonFields = renderTokenComparisonFields(base_coin, target_coin)
  const currentRatio = ratios?.[ratios?.length - 1] ?? 0
  let amountOut = String(currentRatio * +amount)
  let ratio = String(Number(amountOut) / Number(amount))
  ratio = formatUsdDigit(ratio)

  const author = getAuthor(interaction)
  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("CONVERSION")} Conversion`,
    description: [
      `${getEmoji(
        "SWAP_ROUTE"
      )}\`Rate.   \`**${amount} ${from} ${APPROX} ${ratio} ${to}**`,
    ].join("\n"),
    color: msgColors.ACTIVITY,
    originalMsgAuthor: author,
  }).addFields(comparisonFields)

  const { data: tradeRouteData } = await defi.getSwapRoute({
    from: base_coin.symbol.toUpperCase(),
    to: target_coin.symbol.toUpperCase(),
    amount: amount.toString().replace(",", ""),
    profileId,
  })

  let tradeRoute
  const routeSummary = tradeRouteData?.data.routeSummary
  const tokenIn = tradeRouteData?.data.tokenIn
  const tokenOut = tradeRouteData?.data.tokenOut

  if (tradeRouteData?.code === TradeRouteDataCode.RouteDataFound) {
    tradeRoute = await aggregateTradeRoute(
      base_coin.symbol.toUpperCase(),
      routeSummary,
      tradeRouteData.provider
    )
  }

  const components = []
  if (tradeRoute) {
    components.push(
      new MessageActionRow().addComponents(
        new MessageButton({
          label: "Swap",
          emoji: getEmoji("SWAP_ROUTE"),
          style: "SECONDARY",
          customId: "swap",
        })
      )
    )
  }

  const isBridged = tokenIn.chain_id !== tokenOut.chain_id
  const network = isBridged
    ? `${capitalizeFirst(tokenIn.chain_name)} -> ${capitalizeFirst(
        tokenOut.chain_name
      )} (bridge)`
    : `${capitalizeFirst(tokenOut.chain_name)}`

  const amountInUsd = formatUsdDigit(routeSummary.amountInUsd)

  if (tradeRoute) {
    amountOut = utils.formatUnits(
      BigNumber.from(routeSummary?.amountOut ?? 0)
        .mul((100 - SLIPPAGE) * 10)
        .div(1000),
      tokenOut.decimals
    )
  }

  const amountOutUsd = formatUsdDigit(
    (Number(routeSummary.amountOutUsd) * (100 - SLIPPAGE)) / 100
  )

  return {
    context: {
      from,
      to,
      amount,
      routeSummary,
      rate: Number(ratio),
      network,
      gasUsd: `$${formatUsdDigit(routeSummary.gasUsd)}`,
      chainName: tradeRouteData?.chainName,
      amountIn: amount,
      amountInUsd,
      amountOut: formatTokenDigit(amountOut.toString()),
      amountOutUsd,
      compareFields: comparisonFields,
    },
    msgOpts: {
      embeds: [embed, ...(tradeRoute ? [renderRouteEmbed(tradeRoute)] : [])],
      components,
    },
  }
}
