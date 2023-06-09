import {
  ButtonInteraction,
  CommandInteraction,
  Message,
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
import { reply } from "utils/discord"
import { BigNumber, utils } from "ethers"
import { APPROX, HOMEPAGE_URL } from "utils/constants"
import { pascalCase } from "change-case"
import NodeCache from "node-cache"
import defi from "adapters/defi"
import { APIError } from "errors"
import { formatDigit } from "utils/defi"
import { dmUser } from "../../../utils/dm"
import { awaitMessage } from "utils/discord"
import { composeButtonLink } from "ui/discord/button"
import { InternalError } from "errors"
import CacheManager from "cache/node-cache"
import { OriginalMessage } from "errors/base"
import { getBalances } from "utils/tip-bot"
import { formatView } from "commands/balances/index/processor"
import { getSlashCommand } from "utils/commands"
import { checkCommitableOperation } from "commands/withdraw/index/processor"
import { aggregateTradeRoute } from "./aggregate-util"

const cacheExpireTimeSeconds = 180

const swapCache = new NodeCache({
  stdTTL: cacheExpireTimeSeconds,
  checkperiod: 1,
  useClones: false,
})

export const chains = {
  1: "Ethereum",
  56: "BNB",
  250: "Fantom",
  137: "Polygon",
  // 43114: "avalanche",
  // 42161: "arbitrum",
  // 10: "optimism",
  // 199: "bittorrent",
  // 42262: "oasis",
  // 25: "cronos",
  // 106: "velas",
  // 1313161554: "aurora",
}

const native_asset_platform = {
  eth: "ethereum",
  ftm: "fantom",
  bnb: "binancecoin",
  matic: "matic-network",
}

const supported_coin_id = ["ethereum", "fantom", "binancecoin", "matic-network"]

type Context = {
  to?: string
  from?: string
  amountIn?: string
  amountOut?: string
  chainName?: string
  balances?: any
  balance?: any
  wallet?: string
}

type Interaction =
  | CommandInteraction
  | ButtonInteraction
  | SelectMenuInteraction

function renderPreview(params: {
  from?: string
  to?: string
  wallet?: string
  network?: string
  amountIn?: string
  amountOut?: string
  tokenFee?: string
  amountFee?: string
}) {
  const value = [
    params.wallet && `${getEmoji("WALLET_1")}\`Wallet.   ${params.wallet}\``,
    params.network &&
      `${getEmoji("SWAP_ROUTE")}\`Network.  \`${params.network}`,
    params.from &&
      `${getEmoji("ANIMATED_COIN_2", true)}\`In.       \`${getEmoji(
        params.from as TokenEmojiKey
      )} **${params.amountIn ?? ""} ${params.from}**`,
    params.to &&
      `${getEmoji("ANIMATED_COIN_2", true)}\`Out.      \`${getEmoji(
        params.to as TokenEmojiKey
      )} **${params.amountOut ?? ""} ${params.to}**`,
    params.tokenFee &&
      params.amountFee &&
      `${getEmoji("CASH")}\`Fee.      \`${formatDigit({
        value: params.amountFee,
        fractionDigits: 2,
      })} ${params.tokenFee}`,
  ]
    .filter(Boolean)
    .join("\n")
    .trim()

  if (!value) return

  return {
    name: "\u200b\nPreview",
    value,
    inline: false,
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
  const conditions = [
    [!!(propsCount >= 2 && ctx.to && ctx.from), swapStep1, swapStep2],
    [
      !!(propsCount >= 3 && ctx.to && ctx.from && ctx.amountIn),
      swapStep2,
      swapStep3,
    ],
    [
      !!(
        propsCount >= 4 &&
        ctx.to &&
        ctx.from &&
        ctx.amountIn &&
        ctx.chainName
      ),
      swapStep3,
      swapStep4,
    ],
  ] satisfies [
    boolean,
    (i: Interaction, ctx?: Context) => Promise<any>,
    (i: Interaction, ctx?: Context) => Promise<any>
  ][]

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
  const balances = await getBalances({ msgOrInteraction: i })
  const preview = renderPreview({
    to: ctx?.to,
  })
  const [balance, ...rest] = balances.filter((b: any) =>
    equalIgnoreCase(b.token.symbol, ctx?.from)
  )

  const { text } = formatView("compact", "filter-dust", balances)
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
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder("💵 Choose money source (1/4)")
            .setCustomId("select_token")
            .setOptions(
              balances.map((b: any) => ({
                label: `${b.token.symbol}${
                  isDuplicateSymbol(b.token.symbol)
                    ? ` (${b.token.chain.symbol})`
                    : ""
                }`,
                value: b.id,
                emoji: getEmojiToken(b.token.symbol),
              }))
            )
        ),
      ],
    },
  }
}

export async function swapStep2(_i: Interaction, ctx?: Context) {
  if (!ctx?.balance)
    return {
      stop: true,
      initial: "swapStep2",
      context: {
        ...ctx,
        from: undefined,
      },
      msgOpts: {
        embeds: [
          new MessageEmbed({
            description: `<:pepeno2:885513214467661834> **No token ${getEmoji(
              ctx?.from as TokenEmojiKey
            )} ${ctx?.from} found in your balance**`,
            color: msgColors.ERROR,
          }),
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton({
              label: "Select another token",
              style: "SECONDARY",
              customId: "go_back",
            })
          ),
        ],
      },
    }

  let amount = ctx?.amountIn ?? "%0"
  const balance = ctx.balance

  const getPercentage = (percent: number) =>
    BigNumber.from(balance.amount ?? 0)
      .mul(percent)
      .div(100)
      .toString()

  let error
  if (amount.startsWith("%") || amount.toLowerCase() === "all") {
    const formatted = utils.formatUnits(
      getPercentage(
        amount.toLowerCase() === "all" ? 100 : Number(amount.slice(1))
      ),
      balance.token.decimal
    )
    amount = formatDigit({
      value: formatted,
      fractionDigits: Number(formatted) >= 1 ? 0 : undefined,
    })
  } else {
    let valid
    ;({ valid, error } = checkCommitableOperation(
      balance.amount,
      amount ?? "0",
      balance
    ))

    if (valid) {
      amount = formatDigit({
        value: amount ?? "0",
        fractionDigits: Number(amount) >= 1 ? 0 : undefined,
      })
    }
  }

  const ratio = await defi.getRatio(ctx?.from, ctx?.to)

  const newContext = {
    to: ctx?.to,
    from: ctx?.from,
    amountIn: amount,
    amountOut: formatDigit({
      value: +amount * ratio,
      fractionDigits: +amount * ratio >= 1 ? 0 : undefined,
    }),
  }
  const preview = renderPreview(newContext)

  const { text } = formatView("compact", "filter-dust", [balance])

  const embed = composeEmbedMessage(null, {
    author: ["Enter amount", getEmojiURL(emojis.SWAP_ROUTE)],
    description: text,
  })

  if (preview) {
    embed.addFields(preview)
  }

  return {
    initial: "swapStep2",
    context: {
      ...ctx,
      ...newContext,
    },
    msgOpts: {
      embeds: [
        embed,
        ...(error
          ? [
              new MessageEmbed({
                description: `<:pepeno2:885513214467661834> **${error}**`,
                color: msgColors.ERROR,
              }),
            ]
          : []),
      ],
      components: [
        new MessageActionRow().addComponents(
          ...[10, 25, 50].map((p) =>
            new MessageButton()
              .setLabel(`${p}%`)
              .setStyle("SECONDARY")
              .setCustomId(`select_amount_${p}`)
          ),
          new MessageButton()
            .setLabel("All")
            .setStyle("SECONDARY")
            .setCustomId(`select_amount_100`),
          new MessageButton()
            .setLabel("Custom")
            .setStyle("SECONDARY")
            .setCustomId("enter_amount")
        ),
        new MessageActionRow().addComponents(
          new MessageButton({
            label: "Continue (2/4)",
            style: "PRIMARY",
            customId: "continue",
            disabled:
              !ctx?.to ||
              !ctx?.from ||
              !ctx.amountIn ||
              !!error ||
              Number(amount) === 0,
          })
        ),
      ],
    },
  }
}

export async function swapStep3(_i: Interaction, ctx?: Context) {
  if (Number(ctx?.amountIn) === 0)
    return {
      stop: true,
      initial: "swapStep3",
      context: {
        ...ctx,
        amountIn: undefined,
      },
      msgOpts: {
        embeds: [
          new MessageEmbed({
            description: `<:pepeno2:885513214467661834> **You can't swap 0 tokens**`,
            color: msgColors.ERROR,
          }),
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton({
              label: "Enter amount",
              style: "SECONDARY",
              customId: "go_back",
            })
          ),
        ],
      },
    }

  const preview = renderPreview({
    to: ctx?.to,
    from: ctx?.from,
    amountIn: ctx?.amountIn,
    amountOut: ctx?.amountOut,
    network: ctx?.chainName,
  })

  const embed = composeEmbedMessage(null, {
    author: ["Select network", getEmojiURL(emojis.ANIMATED_COIN_2)],
  })

  if (preview) {
    embed.addFields(preview)
  }

  return {
    initial: "swapStep3",
    context: ctx,
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder("🔗 Select chain (3/4)")
            .setCustomId("select_chain")
            .addOptions(
              Object.entries(chains).map((e) => ({
                label: e[1],
                value: e[1],
              }))
            )
        ),
      ],
    },
  }
}

export async function swapStep4(i: Interaction, ctx?: Context) {
  const preview = renderPreview({
    to: ctx?.to,
    from: ctx?.from,
    amountIn: ctx?.amountIn,
    amountOut: ctx?.amountOut,
    network: ctx?.chainName,
    wallet: ctx?.wallet,
  })

  let tradeRouteData: any = {}
  const { data, ok } = await defi.getSwapRoute({
    from: ctx?.from ?? "",
    to: ctx?.to ?? "",
    amount: ctx?.amountIn ?? "0",
    chain_name: ctx?.chainName?.toLowerCase() ?? "",
  })

  if (ok) {
    tradeRouteData = data.data
  }

  const routes = await aggregateTradeRoute(
    tradeRouteData.tokenIn.symbol,
    tradeRouteData.routeSummary
  )

  const embed = composeEmbedMessage(null, {
    author: ["Here is the trade route", getEmojiURL(emojis.ANIMATED_COIN_2)],
    description: routes.join("\n"),
  })

  if (preview) {
    embed.addFields(preview)
  }

  const submitRow = new MessageActionRow()

  if (ctx?.wallet === "Mochi wallet") {
    submitRow.addComponents(
      new MessageButton({
        style: "PRIMARY",
        label: "Swap",
        customId: "submit",
      })
    )
  } else if (ctx?.wallet === "Onchain wallet") {
    submitRow.addComponents(
      new MessageButton({
        style: "PRIMARY",
        label: "Open in web",
        customId: "open_web",
      })
    )
  }

  return {
    initial: "swapStep4",
    context: ctx,
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("select_wallet")
            .setPlaceholder("💰 Select wallet (4/4)")
            .addOptions(
              { label: "🔸 Mochi wallet", value: "offchain" },
              { label: "🔹 Onchain  wallet", value: "onchain" }
            )
        ),
        ...(submitRow.components.length ? [submitRow] : []),
      ],
    },
  }
}

// async function handleSwap(i: ButtonInteraction) {
//   await i.deferUpdate()
//   const [, chainName] = i.customId.split("_")
//   const reply = (await i.fetchReply()) as Message
//   const cacheKey = `swap-${reply.id}`
//   const swapCacheData = swapCache.get(cacheKey) as any
//   if (swapCacheData) {
//     const { status, ok, log, error, curl } = await defi.swap(
//       i.user.id,
//       chainName,
//       swapCacheData.routeSummary
//     )
//     if (!ok) {
//       if (status === 400) {
//         i.editReply({
//           embeds: [getErrorEmbed({ description: error })],
//           components: [],
//         })
//         return
//       }
//       throw new APIError({
//         msgOrInteraction: reply,
//         curl,
//         description: log,
//         error,
//       })
//     }
//
//     swapCache.del(cacheKey)
//
//     //dm user
//     const dm = await dmUser(
//       {
//         embeds: [
//           composeEmbedMessage(null, {
//             author: ["Swap Submitted", thumbnails.MOCHI],
//             image: thumbnails.MOCHI_POSE_4,
//             description:
//               "Your swap is underway, Mochi will DM you with the tx link if it succeeds or error message if it fails (often due to your trade route being expired)",
//           }),
//         ],
//       },
//       i.user,
//       null,
//       i,
//       "Your swap request was submitted, but ",
//       ""
//     )
//     if (!dm) return null
//     await i.editReply({
//       embeds: [
//         composeEmbedMessage(null, {
//           author: ["You're good to go!", thumbnails.MOCHI],
//           image: thumbnails.MOCHI_POSE_2,
//           description: `Your swap request has been submitted, [**check your DM to see the receipt**](${dm.url})`,
//         }),
//       ],
//       components: [],
//     })
//   }
// }
//
// async function render(
//   i: CommandInteraction | ButtonInteraction,
//   data: {
//     routeSummary: RouteSummary
//     tokenIn: { decimals: number }
//     tokenOut: { decimals: number }
//   },
//   from: TokenEmojiKey,
//   to: TokenEmojiKey,
//   chainName: string
// ) {
//   const { routeSummary, tokenIn, tokenOut } = data
//
//   const routes = await aggregateTradeRoute(routeSummary)
//
//   const fromAmountFormatted = formatDigit({
//     value: utils.formatUnits(routeSummary.amountIn, tokenIn.decimals),
//   })
//
//   const toAmountFormatted = formatDigit({
//     value: utils.formatUnits(routeSummary.amountOut, tokenOut.decimals),
//   })
//
//   const fromEmo = getEmojiToken(from, false)
//   const toEmo = getEmojiToken(to, false)
//
//   const embed = composeEmbedMessage(null, {
//     author: ["Swap", getEmojiURL(emojis.SWAP_ROUTE)],
//     thumbnail: getEmojiURL(emojis.SWAP_ROUTE),
//     title: `${fromAmountFormatted} ${from} ${APPROX} ${toAmountFormatted} ${to}`,
//   })
//
//   const tradeRoutes = Object.values(routes).map((route, i) => {
//     return `${i === 0 ? "" : "\n"}${getEmoji("REPLY_3")}${
//       route.percent
//     } ${fromEmo} ${from}\n${route.hops
//       .map((hop, j) => {
//         const lastOfLast =
//           i === Object.values(routes).length - 1 && j === route.hops.length - 1
//
//         return `${
//           lastOfLast ? getEmoji("REPLY") : getEmoji("REPLY_2")
//         } ${getEmojiToken(hop.tokenOutSymbol as TokenEmojiKey, false)} ${
//           hop.tokenOutSymbol
//         }\n${hop.pools
//           .map((p, o) => {
//             return `${lastOfLast ? getEmoji("BLANK") : getEmoji("REPLY_3")}${
//               o === hop.pools.length - 1
//                 ? getEmoji("REPLY")
//                 : getEmoji("REPLY_2")
//             }[(${p.name}: ${p.percent})](${HOMEPAGE_URL})`
//           })
//           .join("\n")}`
//       })
//       .join("\n")}`
//   })
//
//   // check to see if we can combine routes without exceeding discord 1024 char limit
//   const aggregatedRoutes = []
//   for (let i = 0; i < tradeRoutes.length; i++) {
//     const current = tradeRoutes[i]
//     const next = tradeRoutes[i + 1] ?? ""
//     const combined = !next
//       ? current
//       : `${current}\n${getEmoji("REPLY_3")}${next}`
//     if (combined.length <= 1024) {
//       aggregatedRoutes.push(combined)
//       i++
//       continue
//     }
//
//     if (i === tradeRoutes.length - 1 || (tradeRoutes.length === 2 && i === 0))
//       aggregatedRoutes.push(tradeRoutes[i])
//   }
//
//   embed.addFields([
//     {
//       name: "From",
//       value: `${fromEmo} ${fromAmountFormatted} ${from} \n\`$${formatDigit({
//         value: routeSummary.amountInUsd,
//       })}\``,
//       inline: true,
//     },
//     {
//       name: "\u200b",
//       value: "\u200b",
//       inline: true,
//     },
//     {
//       name: "To",
//       value: `${toEmo} ${toAmountFormatted} ${to}\n\`$${formatDigit({
//         value: routeSummary.amountOutUsd,
//       })}\``,
//       inline: true,
//     },
//     {
//       name: "Gas Fee",
//       value: routeSummary.gasUsd
//         ? `${APPROX} \`$${formatDigit({ value: routeSummary.gasUsd })}\``
//         : "Unknown",
//       inline: true,
//     },
//     {
//       name: "\u200b",
//       value: "\u200b",
//       inline: true,
//     },
//     {
//       name: "Chain",
//       value: pascalCase(chainName),
//       inline: true,
//     },
//     ...aggregatedRoutes.map<any>((p, i) => ({
//       name: i === 0 ? "\u200b\nTrade Route" : getEmoji("REPLY_3"),
//       value: p,
//       inline: false,
//     })),
//   ])
//
//   const msgOptions = {
//     embeds: [embed],
//     components: [
//       new MessageActionRow().addComponents(
//         new MessageButton()
//           .setCustomId(`swap-mochi-wallet_${chainName}`)
//           .setLabel("Swap")
//           .setStyle("PRIMARY"),
//         new MessageButton()
//           .setURL(
//             `https://kyberswap.com/swap/${chainName}/${from.toLowerCase()}-to-${to.toLowerCase()}`
//           )
//           .setLabel("View in web")
//           .setStyle("LINK")
//       ),
//     ],
//   }
//   const response = {
//     messageOptions: msgOptions,
//   }
//
//   let replyMsg
//   if (i.type === "MESSAGE_COMPONENT") {
//     const button = i as ButtonInteraction
//     replyMsg = await dmUser(msgOptions, button.user, null, button)
//     if (!replyMsg) return null
//   } else {
//     replyMsg = await reply(i as CommandInteraction, response)
//   }
//
//   if (replyMsg) {
//     swapCache.set(`swap-${replyMsg.id}`, data)
//   }
// }
//
// async function viewTickerRouteSwap(i: ButtonInteraction) {
//   if (!i.deferred) i.deferUpdate()
//   const msg = i.message as Message
//   const author = i.user
//   const [coinId, symbol, chainName] = i.customId.split("|").slice(1)
//   let chain = chainName
//   // when chain from coingecko is null -> only support native token: ftm, eth, matic, bnb. Else return no route data
//   if (chainName == "") {
//     if (supported_coin_id.includes(coinId)) {
//       chain = coinId
//     } else {
//       throw new InternalError({
//         msgOrInteraction: i,
//         description:
//           "No route data found, we're working on adding them in the future, stay tuned.",
//         emojiUrl: getEmojiURL(emojis.SWAP_ROUTE),
//         color: msgColors.GRAY,
//       })
//     }
//   }
//
//   // send dm ask for from token
//   const dmFromTokenPayload = {
//     embeds: [
//       composeEmbedMessage(null, {
//         author: ["Swap", getEmojiURL(emojis.SWAP_ROUTE)],
//         thumbnail: getEmojiURL(emojis.SWAP_ROUTE),
//         description: `Please enter token you want to swap from`,
//         color: msgColors.MOCHI,
//       }),
//     ],
//   }
//   const dmFromToken = await dmUser(dmFromTokenPayload, author, null, i)
//   if (!dmFromToken) return null
//
//   // redirect to dm if not in DM
//   if (i.guildId) {
//     const replyPayload = {
//       embeds: [
//         composeEmbedMessage(null, {
//           author: ["Swap tokens", getEmojiURL(emojis.SWAP_ROUTE)],
//           description: `${author}, a swap message has been sent to you. Check your DM!`,
//         }),
//       ],
//       components: [composeButtonLink("See the DM", dmFromToken.url)],
//     }
//     msg ? msg.reply(replyPayload) : i.editReply(replyPayload)
//   }
//
//   // waiting user input from token
//   const timeoutEmbed = getErrorEmbed({
//     title: "Swap cancelled",
//     description:
//       "No input received. You can retry transaction with `/swap <amount> <from token> <to token> <chain>`",
//   })
//
//   const { content: fromToken } = await awaitMessage({
//     authorId: author.id,
//     msg: dmFromToken,
//     timeoutResponse: { embeds: [timeoutEmbed] },
//   })
//
//   // send dm ask for amount
//   const dmAmountPayload = {
//     embeds: [
//       composeEmbedMessage(null, {
//         author: ["Swap", getEmojiURL(emojis.SWAP_ROUTE)],
//         thumbnail: getEmojiURL(emojis.SWAP_ROUTE),
//         description: `Please enter amount you want to swap`,
//         color: msgColors.MOCHI,
//       }),
//     ],
//   }
//   const dmAmount = await dmUser(dmAmountPayload, author, null, i)
//   if (!dmAmount) return null
//
//   // waiting user input amount
//   const { content: amount } = await awaitMessage({
//     authorId: author.id,
//     msg: dmAmount,
//     timeoutResponse: { embeds: [timeoutEmbed] },
//   })
//
//   // get route data
//   const { ok, data } = await defi.getSwapRoute({
//     from: fromToken,
//     to: symbol,
//     amount: String(amount),
//     chain_name: chain,
//     to_token_id: coinId,
//     from_token_id: await getFromTokenID(dmFromToken, fromToken, chain),
//   })
//
//   if (!ok) {
//     throw new InternalError({
//       msgOrInteraction: dmFromToken,
//       description:
//         "No route data found, we're working on adding them in the future, stay tuned.",
//       emojiUrl: getEmojiURL(emojis.SWAP_ROUTE),
//       color: msgColors.GRAY,
//     })
//   }
//
//   await render(
//     i,
//     data?.data,
//     fromToken.toUpperCase() as TokenEmojiKey,
//     symbol.toUpperCase() as TokenEmojiKey,
//     chain
//   )
// }
//
// async function getFromTokenID(
//   msg: OriginalMessage,
//   symbol: string,
//   chain: string
// ) {
//   const errorTokenNotSp = {
//     msgOrInteraction: msg,
//     description:
//       "No route data found, we're working on adding them in the future, stay tuned.",
//     emojiUrl: getEmojiURL(emojis.SWAP_ROUTE),
//     color: msgColors.GRAY,
//   }
//
//   const { data: coins } = await CacheManager.get({
//     pool: "ticker",
//     key: `ticker-search-${symbol}`,
//     call: () => defi.searchCoins(symbol, ""),
//   })
//   if (!coins || !coins.length) {
//     throw new InternalError(errorTokenNotSp)
//   }
//
//   let coinId = ""
//   for (const coin of coins) {
//     // if native token then return coinId, since coingecko not have asset_platform_id for native token. Temp used hardcode
//     // Ex: $ticker eth -> coingecko return chain = null, but coinId = ethereum
//     if (Object.keys(native_asset_platform).includes(coin.symbol)) {
//       coinId =
//         native_asset_platform[coin.symbol as keyof typeof native_asset_platform]
//       break
//     }
//     // if non native token then check if chain = chain of token.
//     // Ex: $ticker multi -> choose swap from usdt to multi -> query usdt has ethereum chain
//     const { data: coinDetail, status } = await CacheManager.get({
//       pool: "ticker",
//       key: `ticker-getcoin-${coin.id}`,
//       call: () => defi.getCoin(coin.id, false, ""),
//     })
//     if (status === 404) {
//       throw new InternalError(errorTokenNotSp)
//     }
//
//     // get all platform which token exist
//     // Ex: $ticker ftm -> swap from spell to ftm -> spell exist on chain ethereum, fantom, avalanche, arbitrum-one
//     const fromTokenplatforms = Object.keys(coinDetail.platforms)
//     if (fromTokenplatforms.includes(chain)) {
//       coinId = coinDetail.id
//       break
//     }
//   }
//
//   if (coinId === "") {
//     throw new InternalError(errorTokenNotSp)
//   }
//
//   return coinId
// }
