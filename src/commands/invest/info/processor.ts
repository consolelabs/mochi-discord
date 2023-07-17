import { TokenEmojiKey, capitalizeFirst, getEmojiToken } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import CacheManager from "cache/node-cache"
import community from "adapters/community"
import { formatPercentDigit } from "utils/defi"
import { VERTICAL_BAR, DASH, SPACE } from "utils/constants"
import { paginationButtons } from "utils/router"
import { ApiEarningOption, ApiPlatform } from "types/krystal-api"
import { chunk, flatten, groupBy, uniq } from "lodash"
import { InternalError } from "errors"
import {
  ButtonInteraction,
  CommandInteraction,
  SelectMenuInteraction,
} from "discord.js"

type EarningPlatform = ApiPlatform & { chainName: string }

export async function renderInvestToken(token: string) {
  let tokenData = [] as EarningPlatform[]
  const { result, ok } = await CacheManager.get({
    pool: "invest",
    key: `invest-list`,
    call: () => community.getEarns(),
  })

  if (ok) {
    tokenData = flatten(
      result
        .filter(
          (d: ApiEarningOption) =>
            d.token?.symbol?.toLowerCase() === token.toLowerCase()
        )
        .map((d: ApiEarningOption) => {
          return (d.platforms || [])
            .filter((p) => p.status?.value === "active")
            .map((p) => {
              return {
                ...p,
                chainName: d.chain?.name,
              }
            })
        })
    ) as EarningPlatform[]
  }

  if (tokenData.length === 0) {
    const embed = composeEmbedMessage(null, {
      title: `Cannot found`,
      description: `Cannot found any earning options for ${token.toUpperCase()}`,
    })

    return {
      context: {
        token,
      },
      msgOpts: {
        embeds: [embed],
        components: [],
      },
    }
  }

  const { segments } = formatDataTable(
    [
      { platform: "Platform", chain: "Chain", type: "Type", apy: "APY(%)" },
      ...tokenData.map((i: EarningPlatform) => {
        return {
          platform: capitalizeFirst((i.name || "").split("_").join(" ")),
          chain: i.chainName,
          type: capitalizeFirst(i.type || ""),
          apy:
            formatPercentDigit({
              value: String(i.apy),
              fractionDigits: 2,
            }) + "%",
        }
      }),
    ],
    {
      cols: ["platform", "chain", "type", "apy"],
      separator: [VERTICAL_BAR, VERTICAL_BAR],
    }
  )

  const embed = composeEmbedMessage(null, {
    title: `Recommended Earning for ${token.toUpperCase()}`,
    description: `${segments.map((c) => c.join("\n"))}`,
  })

  return {
    context: {
      token,
    },
    msgOpts: {
      embeds: [embed],
      components: [],
    },
  }
}

const PAGE_SIZE = 16 as const

type HomeEarn = {
  symbol: string
  displayApy: string
  minApy: number
  maxApy: number
}

function groupByToken(data: ApiEarningOption[]) {
  const noneZeroApyData = data.filter((d) => d.apy && d.apy > 0)
  const groupedSymbolObj = groupBy(noneZeroApyData, (d) => d.token?.symbol)
  return Object.keys(groupedSymbolObj).map((symbol) => {
    const listApy = groupedSymbolObj[symbol].map((d) => d.apy) as number[]
    const minApy = Math.min(...listApy)
    const maxApy = Math.max(...listApy)
    const displayApy = uniq([
      formatPercentDigit(String(minApy)) + "%",
      formatPercentDigit(String(maxApy)) + "%",
    ]).join(`${SPACE}${DASH}${SPACE}`)
    return {
      symbol,
      minApy,
      maxApy,
      displayApy,
    }
  })
}

export async function renderInvestHome(
  i: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  page = 0,
  availableTokens = [] as string[]
) {
  const isByUser = availableTokens.length > 0
  let tokenData = [] as HomeEarn[]
  let totalPage = 0
  const { result, ok, error } = await CacheManager.get({
    pool: "invest",
    key: `invest-list`,
    call: () => community.getEarns(),
  })

  if (!ok) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Cannot get earn options",
      description: error,
    })
  }

  const groupedData = groupByToken(result)
  const filteredData = groupedData.filter((d) => {
    if (isByUser) {
      return availableTokens.includes(d.symbol)
    }
    return true
  })
  const chunks = chunk(filteredData, PAGE_SIZE)
  tokenData = chunks[page] as HomeEarn[]
  totalPage = Math.ceil(filteredData.length / PAGE_SIZE)

  const { segments } = formatDataTable(
    [
      ...tokenData.map((t) => {
        return {
          symbol: (t.symbol ?? "").toUpperCase(),
          apy: t.displayApy,
        }
      }),
    ],
    {
      cols: ["symbol", "apy"],
      separator: [VERTICAL_BAR],
      rowAfterFormatter: (f, i) =>
        `${getEmojiToken((tokenData[i]?.symbol ?? "") as TokenEmojiKey)}${f}`,
    }
  )

  const embed = composeEmbedMessage(null, {
    title: `Recommended Earning with APY(%)${
      isByUser ? " by your tokens" : ""
    }`,
    description: `${segments.map((c) => c.join("\n"))}`,
  })

  return {
    context: {
      page,
    },
    msgOpts: {
      embeds: [embed],
      components: [...paginationButtons(page, totalPage)],
    },
  }
}
