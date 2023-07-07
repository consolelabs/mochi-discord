import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  TokenEmojiKey,
  thumbnails,
  msgColors,
  capitalizeFirst,
  equalIgnoreCase,
} from "utils/common"
import { BigNumber, utils } from "ethers"
import { APPROX } from "utils/constants"
import defi from "adapters/defi"
import { formatDigit } from "utils/defi"
import { dmUser } from "../../../utils/dm"
import { getBalances } from "utils/tip-bot"
import { formatView } from "commands/balances/index/processor"
import { getSlashCommand } from "utils/commands"
import { checkCommitableOperation } from "commands/withdraw/index/processor"
import { getProfileIdByDiscord } from "utils/profile"
import { aggregateTradeRoute, SWAP_ROUTE_PROVIDERS } from "./aggregate-util"
import { renderTokenComparisonFields } from "commands/ticker/index/processor"

export const SLIPPAGE = 0.5
const DIVIDER = getEmoji("LINE").repeat(5)

type Context = {
  to?: string
  toId?: string
  from?: string
  amountIn?: string
  amountOut?: string
  chainName?: string
  balances?: any
  balance?: any
  wallet?: string
  // use as swap api request body
  swapData?: any
  // use as swap api request body
  aggregator?: string
  isOnchain?: boolean
  rate?: number
  compareFields?: EmbedFieldData[]
  // use to render UI route
  tradeRouteRenderData?: any
}

type Interaction =
  | CommandInteraction
  | ButtonInteraction
  | SelectMenuInteraction

type Info = {
  from?: string
  to?: string
  amountIn?: string
  amountInUsd?: string
  amountOut?: string
  amountOutUsd?: string
  wallet?: string
  network?: string
  gasUsd?: string
  rate?: number
}

function renderMiscInfo(
  params: Pick<Info, "rate" | "wallet" | "network" | "gasUsd" | "from" | "to">
) {
  const value = [
    `${getEmoji("WALLET_1")}\`Source.   ${params.wallet ?? "Mochi wallet"}\``,
    params.network &&
      `${getEmoji("SWAP_ROUTE")}\`Network.  \`${params.network}`,
    params.rate &&
      `${getEmoji("SWAP_ROUTE")}\`Rate.     \`**1 ${params.from} ${APPROX} ${
        params.rate
      } ${params.to}**`,
    `:playground_slide:\`Slippage. \`**${SLIPPAGE}%**`,
    params.gasUsd && `${getEmoji("GAS")}\`Gas.      \`${params.gasUsd}`,
  ]
    .filter(Boolean)
    .join("\n")
    .trim()

  return value
}

function renderPreview(
  params: Pick<Info, "from" | "amountIn" | "to" | "amountOut" | "amountOutUsd">
) {
  const value = [
    params.from &&
      `${getEmoji("ANIMATED_COIN_2", true)}\`In.       \`${getEmoji(
        params.from as TokenEmojiKey
      )} **${params.amountIn ?? ""} ${params.from}**`,
    params.to &&
      `${getEmoji("ANIMATED_COIN_2", true)}\`Out.      \`${getEmoji(
        params.to as TokenEmojiKey
      )} **${params.amountOut ?? ""} ${params.to} ${
        params.amountOutUsd ? `(${APPROX} $${params.amountOutUsd})` : ""
      }**`,
  ]
    .filter(Boolean)
    .join("\n")
    .trim()

  return value
}

function renderFullInfo(params: Info) {
  const preview = renderPreview(params)
  const misc = renderMiscInfo(params)

  return {
    name: `\u200b\nPreview`,
    value: [preview, misc].join("\n"),
    inline: false,
  }
}

function renderNoTradeRouteData(
  from?: string,
  to?: string,
  code?: TradeRouteDataCode
) {
  let reason = "N/A"
  switch (code) {
    case TradeRouteDataCode.NoRoute:
      reason = "No possible route can be found."
      break
    case TradeRouteDataCode.HighPriceImpact:
      reason = "This route has a high price impact."
      break
    case TradeRouteDataCode.ProviderError:
    default:
      reason = "Internal error."
      break
  }

  return {
    embeds: [
      getErrorEmbed({
        title: "Swap request failed",
        color: msgColors.GRAY,
        description: [
          `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Something went wrong when getting route data.`,
          `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Please check error detail and try again.`,
        ].join("\n"),
      }).addFields({
        name: "Detail",
        value: [
          `${getEmoji("CONFIG")} \`Reason.   \`${reason}`,
          `${getEmoji("INFO")} \`Code.     \`${code}`,
          `${getEmoji("ANIMATED_COIN_2", true)} \`From.     \`${getEmojiToken(
            from as TokenEmojiKey
          )} **${from}**`,
          `${getEmoji("ANIMATED_COIN_2", true)} \`To.       \`${getEmojiToken(
            to as TokenEmojiKey
          )} **${to}**`,
        ].join("\n"),
      }),
    ],
    components: [],
  }
}

// this will jump to step N if the context object has enough data to skip previous N-1 steps
export async function jumpToStep(
  i: Interaction,
  ctx: Context = {}
): Promise<any> {
  let step: any = swapStep1
  let mergedContext: Context = ctx

  const propsCount = Object.entries(ctx).filter(
    (e) => e[1] !== null && e[1] !== undefined
  ).length
  if (propsCount <= 1) return swapStep1(i, ctx)
  const conditions: [
    boolean,
    (i: Interaction, ctx?: Context) => Promise<any>,
    (i: Interaction, ctx?: Context) => Promise<any>
  ][] = [[!!(propsCount >= 2 && ctx.to && ctx.from), swapStep1, swapStep2]]

  for (const [cond, executor, next] of conditions) {
    if (cond) {
      const { context, stop, ...rest } = (await executor(
        i,
        mergedContext
      )) as any
      mergedContext = {
        ...mergedContext,
        ...context,
      }
      if (stop) {
        return {
          context,
          ...rest,
        }
      }
      step = next
    }
  }

  if (!step) return swapStep1(i, ctx)

  return step(i, mergedContext)
}

export async function swapStep1(i: Interaction, ctx?: Context) {
  let balances = await getBalances({ msgOrInteraction: i })
  const { data: coins } = await defi.searchCoins(ctx?.to ?? "")
  const coinId = coins?.find((c: any) => c.most_popular).id

  balances = balances.filter(
    (b: any) => b.token.coin_gecko_id !== (ctx?.toId || coinId)
  )

  const preview = renderFullInfo({
    to: ctx?.to,
  })
  const [balance, ...rest] = balances.filter((b: any) =>
    equalIgnoreCase(b.token.symbol, ctx?.from)
  )

  // TODO: remove hardcode 1
  const { text } = formatView("compact", "filter-dust", balances, 0)
  const isNotEmpty = !!text
  const emptyText = `${getEmoji(
    "ANIMATED_POINTING_RIGHT",
    true
  )} You have nothing yet, use ${await getSlashCommand(
    "earn"
  )} or ${await getSlashCommand("deposit")} `

  const embed = composeEmbedMessage(null, {
    author: ["Enter token to swap from", getEmojiURL(emojis.SWAP_ROUTE)],
    description: isNotEmpty ? text : emptyText,
  })

  if (preview) {
    embed.addFields(preview)
  }

  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1

  return {
    initial: "swapStep1",
    context: {
      ...ctx,
      ...(rest.length === 0 ? { balance } : {}),
      balances,
    },
    msgOpts: {
      files: [],
      embeds: [
        embed,
        ...(ctx?.from && !balance
          ? [
              new MessageEmbed({
                description: `${getEmoji("NO")} No token ${getEmojiToken(
                  ctx.from as TokenEmojiKey
                )} **${ctx.from}** found in your balance.`,
                color: msgColors.ERROR,
              }),
            ]
          : []),
      ],
      components: balances.length
        ? [
            new MessageActionRow().addComponents(
              new MessageSelectMenu()
                .setPlaceholder("💵 Choose money source (1/2)")
                .setCustomId("select_token")
                .setOptions(
                  balances
                    .filter(
                      (b: any) =>
                        b.token.coin_gecko_id !== (ctx?.toId || coinId)
                    )
                    .map((b: any) => ({
                      label: `${b.token.symbol}${
                        isDuplicateSymbol(b.token.symbol)
                          ? ` (${b.token.chain.symbol})`
                          : ""
                      }`,
                      value: `${b.id}/offchain`,
                      emoji: getEmojiToken(b.token.symbol),
                    }))
                )
            ),
          ]
        : [],
    },
  }
}

export enum TradeRouteDataCode {
  NoRoute = 0,
  RouteDataFound,
  HighPriceImpact,
  ProviderError,
}

export async function swapStep2(i: Interaction, ctx?: Context): Promise<any> {
  if (!ctx?.balance && !ctx?.isOnchain)
    return {
      stop: true,
      initial: "swapStep1",
      context: ctx,
      msgOpts: (await swapStep1(i, ctx)).msgOpts,
    }

  const amountChoice = ctx.amountIn
  let amount = ctx?.amountIn ?? "%100"
  const balance = ctx.balance ?? {
    amount: "1000000000000000000000",
    token: { symbol: "XXX", decimal: 18 },
  }

  const getPercentage = (percent: number) =>
    BigNumber.from(balance.amount ?? 0)
      .mul(percent)
      .div(100)
      .toString()

  let error
  const isAll = equalIgnoreCase(amount, "all") || amount === "%100"
  if (amount.startsWith("%") || isAll) {
    const formatted = utils.formatUnits(
      getPercentage(
        amount.toLowerCase() === "all" ? 100 : Number(amount.slice(1))
      ),
      balance.token.decimal
    )
    amount = formatDigit({
      value: Number(formatted),
      fractionDigits: isAll ? 2 : Number(formatted) >= 1000 ? 0 : 2,
    })
  } else {
    let valid
    ;({ valid, error } = checkCommitableOperation(
      balance.amount,
      amount ?? "0",
      balance.token
    ))

    if (valid) {
      amount = formatDigit({
        value: amount ?? "0",
        fractionDigits: Number(amount) >= 1000 ? 0 : 2,
      })
    }
  }

  const { text } = formatView("compact", "filter-dust", [balance], 0)

  const embed = composeEmbedMessage(null, {
    author: ["Enter amount", getEmojiURL(emojis.SWAP_ROUTE)],
    description: text,
  })

  const profileId = await getProfileIdByDiscord(i.user.id)
  const { data: getSwapRouteRes, ok } = await defi.getSwapRoute({
    from: ctx?.from ?? "",
    to: ctx?.to ?? "",
    amount: amount.replace(",", ""),
    profileId,
  })

  if (
    !ok ||
    [TradeRouteDataCode.NoRoute, TradeRouteDataCode.HighPriceImpact].includes(
      getSwapRouteRes.code
    )
  ) {
    return {
      initial: "noTradeRouteFound",
      msgOpts: renderNoTradeRouteData(ctx.from, ctx.to, getSwapRouteRes?.code),
    }
  }

  const routeSummary = getSwapRouteRes.data.routeSummary
  const tokenIn = getSwapRouteRes.data.tokenIn
  const tokenOut = getSwapRouteRes.data.tokenOut
  const swapData = getSwapRouteRes.data.swapData
  const aggregator = getSwapRouteRes.data.aggregator

  const amountInUsd = formatDigit({
    value: routeSummary.amountInUsd,
    fractionDigits: Number(routeSummary.amountInUsd) >= 100 ? 0 : 2,
  })

  const amountOut = utils.formatUnits(
    BigNumber.from(routeSummary.amountOut)
      .mul((100 - SLIPPAGE) * 10)
      .div(1000),
    tokenOut.decimals
  )

  const amountOutUsd = formatDigit({
    value: (Number(routeSummary.amountOutUsd) * (100 - SLIPPAGE)) / 100,
    fractionDigits: Number(routeSummary.amountOutUsd) >= 100 ? 0 : 2,
  })

  let ratio = String(Number(amountOut) / Number(amount))
  ratio = formatDigit({
    value: ratio,
    fractionDigits: Number(ratio) >= 100 ? 0 : 2,
  })

  const isBridged = tokenIn.chain_id !== tokenOut.chain_id

  const network = isBridged
    ? `${capitalizeFirst(tokenIn.chain_name)} -> ${capitalizeFirst(
        tokenOut.chain_name
      )} (bridge)`
    : `${capitalizeFirst(tokenOut.chain_name)}`

  const newContext = {
    to: ctx?.to,
    from: ctx?.from,
    amountIn: amount,
    amountInUsd,
    amountOut: formatDigit({
      value: amountOut.toString(),
      fractionDigits: Number(amountOut) >= 1000 ? 0 : 2,
    }),
    amountOutUsd,
    wallet: ctx.wallet,
    rate: Number(ratio),
    network,
    gasUsd: `$${formatDigit({
      value: routeSummary.gasUsd,
      fractionDigits: 2,
    })}`,
  }
  const preview = renderFullInfo(newContext)

  const [fromId, toId] = [tokenIn.coingecko_id, tokenOut.coingecko_id]
  let compareFields: EmbedFieldData[] = ctx.compareFields ?? []
  if (!compareFields.length) {
    if (fromId && toId) {
      const { ok, data } = await defi.compareToken(
        i.guildId ?? "",
        fromId,
        toId,
        1
      )
      if (ok) {
        compareFields = [
          ...renderTokenComparisonFields(data.base_coin, data.target_coin),
        ]
      }
    }
  }
  embed.addFields(compareFields)

  if (preview) {
    preview.name = `${DIVIDER}${preview.name}`
    embed.addFields(preview)
  }

  const tradeRouteRenderData = await aggregateTradeRoute(
    ctx.from ?? "",
    routeSummary,
    getSwapRouteRes.provider
  )

  return {
    stop: !!error,
    initial: "swapStep2",
    context: {
      ...ctx,
      ...newContext,
      chainName: getSwapRouteRes.chainName,
      swapData,
      aggregator,
      balance,
      compareFields,
      tradeRouteRenderData,
    },
    msgOpts: {
      embeds: [
        embed,
        ...(error
          ? [
              new MessageEmbed({
                description: `${getEmoji("NO")} **${error}**`,
                color: msgColors.ERROR,
              }),
            ]
          : []),
        renderRouteEmbed(tradeRouteRenderData),
      ],
      components: [
        new MessageActionRow().addComponents(
          ...[10, 25, 50].map((p) =>
            new MessageButton()
              .setLabel(`${p}%`)
              .setStyle("SECONDARY")
              .setCustomId(`select_amount_${p}`)
              .setDisabled(amountChoice === `%${p}`)
          ),
          new MessageButton()
            .setLabel("All")
            .setStyle("SECONDARY")
            .setCustomId(`select_amount_100`)
            .setDisabled(isAll),
          new MessageButton()
            .setLabel("Custom")
            .setStyle("SECONDARY")
            .setCustomId("enter_amount")
        ),
        new MessageActionRow().addComponents(
          new MessageButton({
            label: "Confirm (2/2)",
            style: "PRIMARY",
            customId: "confirm",
            disabled:
              !ctx?.to ||
              !ctx?.from ||
              !amount ||
              !!error ||
              Number(amount) === 0,
          })
        ),
      ],
    },
  }
}

export function renderRouteEmbed({
  text,
  routeCount,
  provider,
}: {
  text: string[]
  routeCount: number
  provider: keyof typeof SWAP_ROUTE_PROVIDERS
}) {
  return composeEmbedMessage(null, {
    author: ["Your trade route", getEmojiURL(emojis.SWAP_ROUTE)],
    description: `Routing through ${routeCount} route${
      routeCount > 1 ? "s" : ""
    }\n${getEmoji("REPLY_3")}\n${text.join("\n")}\n\n_route via [${
      SWAP_ROUTE_PROVIDERS[provider].name
    }](${SWAP_ROUTE_PROVIDERS[provider].url})_`,
  })
}

export async function executeSwap(i: ButtonInteraction, ctx?: Context) {
  if (!ctx?.swapData || !ctx.chainName || !ctx.aggregator) {
    return {
      initial: "noTradeRouteFound",
      msgOpts: renderNoTradeRouteData(ctx?.from, ctx?.to),
    }
  }

  await defi.swap(i.user.id, ctx.chainName, ctx.aggregator, ctx.swapData)
  const dm = await dmUser(
    {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Swap Submitted", thumbnails.MOCHI],
          image: thumbnails.MOCHI_POSE_17,
          description: [
            `${getEmoji("CHECK")} Your swap is underway.`,
            `${getEmoji("CHECK")} Mochi will DM you with the tx link shortly.`,
          ].join("\n"),
        }),
      ],
    },
    i.user,
    null,
    i,
    "Your swap request was submitted, but ",
    ""
  )

  const fields: EmbedFieldData[] = []

  if (ctx.compareFields?.length) {
    fields.push(...ctx.compareFields)
  }

  fields.push({
    name: DIVIDER,
    value: renderMiscInfo(ctx),
    inline: false,
  })

  const amountOut = Number(ctx.amountOut)

  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Swap submitted", getEmojiURL(emojis.SWAP_ROUTE)],
          description: `**You will receive ${formatDigit({
            value: amountOut,
            fractionDigits: amountOut >= 1000 ? 0 : 2,
          })} ${ctx.to}**\n${renderPreview(ctx)}`,
        }).addFields(fields),
        renderRouteEmbed(ctx.tradeRouteRenderData),
      ],
      components: [
        ...(dm
          ? [
              new MessageActionRow().addComponents(
                new MessageButton({
                  style: "LINK",
                  label: "Check DM",
                  url: dm.url,
                })
              ),
            ]
          : []),
      ],
    },
  }
}
