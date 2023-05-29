import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiToken,
  getEmojiURL,
  TokenEmojiKey,
  thumbnails,
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

const cacheExpireTimeSeconds = 180

const swapCache = new NodeCache({
  stdTTL: cacheExpireTimeSeconds,
  checkperiod: 1,
  useClones: false,
})

export const chains = {
  1: "ethereum",
  56: "bnb",
  250: "fantom",
  137: "polygon",
  // 43114: "avalanche",
  // 42161: "arbitrum",
  // 10: "optimism",
  // 199: "bittorrent",
  // 42262: "oasis",
  // 25: "cronos",
  // 106: "velas",
  // 1313161554: "aurora",
}

type Route = {
  tokenIn: string
  tokenOut: string
  tokenOutSymbol: string
  amountOut: string
  exchange: string
  swapAmount: string
  pool: string
}

export type RouteSummary = {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountInUsd: string
  amountOut: string
  amountOutUsd: string
  gasUsd: string
  route: Array<Array<Route>>
}

type Pool = {
  address: string
  name: string
  swapAmount: BigNumber
  percent: string
}

type Hop = {
  tokenIn: string
  tokenOut: string
  tokenOutSymbol: string
  amountOut: BigNumber
  pools: Array<Pool>
}

type AggregatedRoute = {
  percent: string
  swapAmount: BigNumber
  hops: Array<Hop>
}

type AggregatedTradeRoute = Record<string, AggregatedRoute>

// function to parse route data from kyberswap to our format for easier display
async function parseTradeRoute(routeSummary: RouteSummary) {
  const data: AggregatedTradeRoute = {}

  routeSummary.route.forEach((hops) => {
    const key = hops
      .map((r) => `${r.tokenIn}-${r.tokenOut}`)
      .reduce((acc, c) => {
        if (!acc) return c
        const [tokenIn] = c.split("-")
        return acc.replace(tokenIn, c)
      }, "")

    const route = data[key] ?? {
      swapAmount: BigNumber.from(0),
      hops: [],
    }

    hops.forEach((hop, i) => {
      const routeHop = route.hops.find(
        (h) => h.tokenIn === hop.tokenIn && h.tokenOut === hop.tokenOut
      )

      if (i === 0) {
        route.swapAmount = route.swapAmount.add(hop.swapAmount)
      }

      if (!routeHop) {
        route.hops.push({
          tokenIn: hop.tokenIn,
          tokenOut: hop.tokenOut,
          tokenOutSymbol: hop.tokenOutSymbol,
          amountOut: BigNumber.from(hop.amountOut),
          pools: [
            {
              name: hop.exchange,
              address: hop.pool,
              swapAmount: BigNumber.from(hop.swapAmount),
              percent: "",
            },
          ],
        })
        return
      }

      routeHop.amountOut = routeHop.amountOut.add(hop.amountOut)

      const pool = routeHop.pools.find((p) => p.address === hop.pool)

      if (!pool) {
        routeHop.pools.push({
          name: hop.exchange,
          address: hop.pool,
          swapAmount: BigNumber.from(hop.swapAmount),
          percent: "",
        })
        return
      }

      pool.swapAmount = pool.swapAmount.add(hop.swapAmount)
    })

    data[key] = route
  })

  return { data, totalAmountIn: BigNumber.from(routeSummary.amountIn) }
}

// calculate the percentage of each pool in a hop in a route
async function calculatePercentage({
  data,
  totalAmountIn,
}: {
  data: AggregatedTradeRoute
  totalAmountIn: BigNumber
}) {
  Object.values(data).forEach((d) => {
    d.percent = `${d.swapAmount.mul(100).div(totalAmountIn).toString()}%`

    d.hops.forEach((hop, i) => {
      const previousHop = d.hops[i - 1]?.amountOut ?? d.swapAmount

      let subtotal = BigNumber.from(0)
      hop.pools.forEach((p, i) => {
        if (i === hop.pools.length - 1) {
          p.percent = `${BigNumber.from(100).sub(subtotal)}%`
        } else {
          const num = Math.round(
            p.swapAmount.mul(1000).div(previousHop).toNumber() / 10
          )
          subtotal = subtotal.add(num)
          p.percent = `${num}%`
        }
      })
    })
  })

  return data
}

async function aggregateTradeRoute(routeSummary: RouteSummary) {
  return parseTradeRoute(routeSummary).then(calculatePercentage)
}

export async function handleSwap(i: ButtonInteraction) {
  await i.deferUpdate()
  const [, chainName] = i.customId.split("_")
  const reply = (await i.fetchReply()) as Message
  const cacheKey = `swap-${reply.id}`
  const swapCacheData = swapCache.get(cacheKey) as any
  if (swapCacheData) {
    const { status, ok, log, error, curl } = await defi.swap(
      i.user.id,
      chainName,
      swapCacheData.routeSummary
    )
    if (!ok) {
      if (status === 400) {
        i.editReply({
          embeds: [getErrorEmbed({ description: error })],
          components: [],
        })
        return
      }
      throw new APIError({
        msgOrInteraction: reply,
        curl,
        description: log,
        error,
      })
    }

    swapCache.del(cacheKey)

    //dm user
    const dm = await dmUser(
      {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Swap Submitted", thumbnails.MOCHI],
            image: thumbnails.MOCHI_POSE_4,
            description:
              "Your swap is underway, Mochi will DM you with the tx link if it succeeds or error message if it fails (often due to your trade route being expired)",
          }),
        ],
      },
      i.user,
      null,
      i,
      "Your swap request was submitted, but ",
      ""
    )
    if (!dm) return null
    await i.editReply({
      embeds: [
        composeEmbedMessage(null, {
          author: ["You're good to go!", thumbnails.MOCHI],
          image: thumbnails.MOCHI_POSE_2,
          description: `Your swap request has been submitted, [**check your DM to see the receipt**](${dm.url})`,
        }),
      ],
      components: [],
    })
  }
}

export async function render(
  i: CommandInteraction,
  data: {
    routeSummary: RouteSummary
    tokenIn: { decimals: number }
    tokenOut: { decimals: number }
  },
  from: TokenEmojiKey,
  to: TokenEmojiKey,
  chainName: string
) {
  const { routeSummary, tokenIn, tokenOut } = data

  const routes = await aggregateTradeRoute(routeSummary)

  const fromAmountFormatted = formatDigit({
    value: utils.formatUnits(routeSummary.amountIn, tokenIn.decimals),
  })

  const toAmountFormatted = formatDigit({
    value: utils.formatUnits(routeSummary.amountOut, tokenOut.decimals),
  })

  const fromEmo = getEmojiToken(from, false)
  const toEmo = getEmojiToken(to, false)

  const embed = composeEmbedMessage(null, {
    author: ["Swap", getEmojiURL(emojis.SWAP_ROUTE)],
    thumbnail: getEmojiURL(emojis.SWAP_ROUTE),
    title: `${fromAmountFormatted} ${from} ${APPROX} ${toAmountFormatted} ${to}`,
  })

  const tradeRoutes = Object.values(routes).map((route, i) => {
    return `${i === 0 ? "" : "\n"}${getEmoji("REPLY_3")}${
      route.percent
    } ${fromEmo} ${from}\n${route.hops
      .map((hop, j) => {
        const lastOfLast =
          i === Object.values(routes).length - 1 && j === route.hops.length - 1

        return `${
          lastOfLast ? getEmoji("REPLY") : getEmoji("REPLY_2")
        } ${getEmojiToken(hop.tokenOutSymbol as TokenEmojiKey, false)} ${
          hop.tokenOutSymbol
        }\n${hop.pools
          .map((p, o) => {
            return `${lastOfLast ? getEmoji("BLANK") : getEmoji("REPLY_3")}${
              o === hop.pools.length - 1
                ? getEmoji("REPLY")
                : getEmoji("REPLY_2")
            }[(${p.name}: ${p.percent})](${HOMEPAGE_URL})`
          })
          .join("\n")}`
      })
      .join("\n")}`
  })

  // check to see if we can combine routes without exceeding discord 1024 char limit
  const aggregatedRoutes = []
  for (let i = 0; i < tradeRoutes.length; i++) {
    const current = tradeRoutes[i]
    const next = tradeRoutes[i + 1] ?? ""
    const combined = !next
      ? current
      : `${current}\n${getEmoji("REPLY_3")}${next}`
    if (combined.length <= 1024) {
      aggregatedRoutes.push(combined)
      i++
      continue
    }

    if (i === tradeRoutes.length - 1 || (tradeRoutes.length === 2 && i === 0))
      aggregatedRoutes.push(tradeRoutes[i])
  }

  embed.addFields([
    {
      name: "From",
      value: `${fromEmo} ${fromAmountFormatted} ${from} \n\`$${formatDigit({
        value: routeSummary.amountInUsd,
      })}\``,
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "To",
      value: `${toEmo} ${toAmountFormatted} ${to}\n\`$${formatDigit({
        value: routeSummary.amountOutUsd,
      })}\``,
      inline: true,
    },
    {
      name: "Gas Fee",
      value: routeSummary.gasUsd
        ? `${APPROX} \`$${formatDigit({ value: routeSummary.gasUsd })}\``
        : "Unknown",
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "Chain",
      value: pascalCase(chainName),
      inline: true,
    },
    ...aggregatedRoutes.map<any>((p, i) => ({
      name: i === 0 ? "\u200b\nTrade Route" : getEmoji("REPLY_3"),
      value: p,
      inline: false,
    })),
  ])

  const response = {
    messageOptions: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId(`swap-mochi-wallet_${chainName}`)
            .setLabel("Swap")
            .setStyle("PRIMARY"),
          new MessageButton()
            .setURL(
              `https://kyberswap.com/swap/${chainName}/${from.toLowerCase()}-to-${to.toLowerCase()}`
            )
            .setLabel("View in web")
            .setStyle("LINK")
        ),
      ],
    },
  }

  const replyMsg = await reply(i, response)

  if (replyMsg) {
    swapCache.set(`swap-${replyMsg.id}`, data)
  }
}
