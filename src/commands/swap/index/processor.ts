import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { reply } from "utils/discord"
import profile from "adapters/profile"
import { BigNumber, utils } from "ethers"
import { HOMEPAGE_URL } from "utils/constants"
import { pascalCase } from "change-case"

export const chains = {
  1: "ethereum",
  56: "bnb",
  250: "fantom",
  137: "polygon",
  43114: "avalanche",
  42161: "arbitrum",
  10: "optimism",
  199: "bittorrent",
  42262: "oasis",
  25: "cronos",
  106: "velas",
  1313161554: "aurora",
}

const approx = "≈"

const ids = {
  SWAP_SELECTED_WALLET: "swap_selected_wallet",
  SWAP_NO_WALLETS_FOUND: "swap_no_wallets_found",
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

function format2Digit(s: string) {
  return s
    .split(".")
    .reduce(
      (acc, c, i) => (i !== 0 ? (acc += c.slice(0, 2)) : (acc += `${c}.`)),
      ""
    )
}

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

const defaultToken = "<:_:1058304286217490502>"

export async function render(
  i: CommandInteraction,
  data: {
    routeSummary: RouteSummary
    tokenIn: { decimals: number }
    tokenOut: { decimals: number }
  },
  from: string,
  to: string,
  chainName: string
) {
  const { routeSummary, tokenIn, tokenOut } = data
  const { associated_accounts } = await profile.getByDiscord(i.user.id)
  const wallets = associated_accounts.filter(
    (aa: any) => aa.platform.toLowerCase() !== "discord"
  )
  const isEmpty = wallets.length === 0

  const routes = await aggregateTradeRoute(routeSummary)

  const fromAmountFormatted = format2Digit(
    utils.formatUnits(routeSummary.amountIn, tokenIn.decimals)
  )
  const toAmountFormatted = format2Digit(
    utils.formatUnits(routeSummary.amountOut, tokenOut.decimals)
  )

  const fromEmo = getEmoji(from, false, defaultToken)
  const toEmo = getEmoji(to, false, defaultToken)

  const embed = composeEmbedMessage(null, {
    author: ["Swap", getEmojiURL(emojis.SWAP_ROUTE)],
    thumbnail: getEmojiURL(emojis.SWAP_ROUTE),
    title: `${fromAmountFormatted} ${from} ${approx} ${toAmountFormatted} ${to}`,
  })

  const tradeRoutes = Object.values(routes).map((route, i) => {
    return `${i === 0 ? "" : "\n"}${getEmoji("reply_3")}${
      route.percent
    } ${fromEmo} ${from}\n${route.hops
      .map((hop, j) => {
        const lastOfLast =
          i === Object.values(routes).length - 1 && j === route.hops.length - 1

        return `${
          lastOfLast ? getEmoji("reply") : getEmoji("reply_2")
        } ${getEmoji(hop.tokenOutSymbol, false, defaultToken)} ${
          hop.tokenOutSymbol
        }\n${hop.pools
          .map((p, o) => {
            return `${lastOfLast ? getEmoji("blank") : getEmoji("reply_3")}${
              o === hop.pools.length - 1
                ? getEmoji("reply")
                : getEmoji("reply_2")
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
      : `${current}\n${getEmoji("reply_3")}${next}`
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
      value: `${fromEmo} ${fromAmountFormatted} ${from}\n\`$${format2Digit(
        routeSummary.amountInUsd
      )}\``,
      inline: true,
    },
    {
      name: "\u200b",
      value: "\u200b",
      inline: true,
    },
    {
      name: "To",
      value: `${toEmo} ${toAmountFormatted} ${to}\n\`$${format2Digit(
        routeSummary.amountOutUsd
      )}\``,
      inline: true,
    },
    {
      name: "Gas Fee",
      value: routeSummary.gasUsd
        ? `${approx} \`$${format2Digit(routeSummary.gasUsd)}\``
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
      name: i === 0 ? "\u200b\nTrade Route" : getEmoji("reply_3"),
      value: p,
      inline: false,
    })),
  ])

  const response = {
    messageOptions: {
      embeds: [embed],
      components: isEmpty
        ? [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel("You have no associated wallets")
                .setCustomId(ids.SWAP_NO_WALLETS_FOUND)
                .setStyle("SECONDARY")
                .setDisabled(true)
            ),
          ]
        : [
            // TODO: uncomment when we have mochi wallet and able to auto swap on discord using api
            // new MessageActionRow().addComponents(
            //   new MessageSelectMenu()
            //     .setCustomId(ids.SWAP_SELECTED_WALLET)
            //     .setPlaceholder("Select a wallet")
            //     .addOptions(
            //       wallets.slice(0, 25).map((w: any, i: number) => {
            //         return {
            //           emoji: i > 8 ? "" : getEmoji(`num_${i + 1}`),
            //           label: w.platform_identifier,
            //           description:
            //             w.platform === "evm-chain"
            //               ? "EVM"
            //               : w.platform === "solana-chain"
            //               ? "SOL"
            //               : "",
            //           value: `${w.platform}_${w.platform_identifier}`,
            //         }
            //       })
            //     )
            // ),
            new MessageActionRow().addComponents(
              new MessageButton()
                .setURL(
                  `https://kyberswap.com/swap/${chainName}/${from}-to-${to}`
                )
                .setLabel("View in web")
                .setStyle("LINK")
            ),
          ],
    },
  }

  reply(i, response)
}
