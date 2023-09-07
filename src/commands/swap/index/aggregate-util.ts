import { BigNumber } from "ethers"
import { getEmoji, getEmojiToken, TokenEmojiKey } from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"

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
function parseTradeRoute(routeSummary: RouteSummary) {
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
        (h) => h.tokenIn === hop.tokenIn && h.tokenOut === hop.tokenOut,
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

  return Promise.resolve({
    data,
    totalAmountIn: BigNumber.from(routeSummary.amountIn),
  })
}

// calculate the percentage of each pool in a hop in a route
function calculatePercentage({
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
            p.swapAmount.mul(1000).div(previousHop).toNumber() / 10,
          )
          subtotal = subtotal.add(num)
          p.percent = `${num}%`
        }
      })
    })
  })

  return Promise.resolve(data)
}

function format(tokenIn: string) {
  return function (routes: AggregatedTradeRoute) {
    const routeCount = Object.values(routes).length
    const fromEmo = getEmojiToken(tokenIn as TokenEmojiKey, false)

    const tradeRoutes = Object.values(routes).map((route, i) => {
      const lastRoute = i === Object.values(routes).length - 1
      return `${i === 0 ? "" : "\n"}${getEmoji("REPLY_3")}${
        route.percent
      } ${fromEmo} ${tokenIn}\n${route.hops
        .map((hop, j) => {
          const lastHop = j === route.hops.length - 1

          return `${
            lastRoute && j === 0
              ? getEmoji("REPLY")
              : lastRoute && j !== 0
              ? getEmoji("BLANK")
              : getEmoji("REPLY_2")
          }${getEmojiToken(hop.tokenOutSymbol as TokenEmojiKey, false)} ${
            hop.tokenOutSymbol
          }\n${hop.pools
            .map((p, o) => {
              return `${lastRoute ? getEmoji("BLANK") : getEmoji("REPLY_3")}${
                o === hop.pools.length - 1 && lastHop
                  ? getEmoji("REPLY")
                  : getEmoji("REPLY_2")
              }[(${p.name ? `${p.name}: ` : ""}${p.percent})](${HOMEPAGE_URL})`
            })
            .join("\n")}`
        })
        .join("\n")}`
    })

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

    return { text: aggregatedRoutes, routeCount }
  }
}

export const SWAP_ROUTE_PROVIDERS = {
  "kyber-swap": {
    name: "KyberSwap",
    url: "https://kyberswap.com",
  },
  jupyter: {
    name: "Jupiter",
    url: "https://jup.ag/",
  },
} as const

export async function aggregateTradeRoute(
  tokenIn: string,
  routeSummary: RouteSummary,
  provider: keyof typeof SWAP_ROUTE_PROVIDERS,
) {
  const routes = await parseTradeRoute(routeSummary)
    .then(calculatePercentage)
    .then(format(tokenIn))

  return {
    ...routes,
    provider,
  }
}
