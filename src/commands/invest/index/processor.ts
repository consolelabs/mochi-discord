import { getEmojiToken, TokenEmojiKey } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import CacheManager from "cache/node-cache"
import community from "adapters/community"
import { formatDigit } from "utils/defi"
import { VERTICAL_BAR } from "utils/constants"
import { paginationButtons } from "utils/router"
import { ApiEarningOption } from "types/krystal-api"
import { chunk, groupBy, uniq } from "lodash"

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
      formatDigit({
        value: String(minApy),
        fractionDigits: 2,
      }) + "%",
      formatDigit({
        value: String(maxApy),
        fractionDigits: 2,
      }) + "%",
    ]).join("~")
    return {
      symbol,
      minApy,
      maxApy,
      displayApy,
    }
  })
}

export async function renderInvestHome(page = 0) {
  let tokenData = [] as HomeEarn[]
  let totalPage = 0
  const { result, ok } = await CacheManager.get({
    pool: "invest",
    key: `invest-list`,
    call: () => community.getEarns(),
  })

  if (ok) {
    const groupedData = groupByToken(result)
    const chunks = chunk(groupedData, PAGE_SIZE)
    tokenData = chunks[page] as HomeEarn[]
    totalPage = Math.ceil(groupedData.length / PAGE_SIZE)
  }

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
      separator: [VERTICAL_BAR, VERTICAL_BAR],
      rowAfterFormatter: (f, i) =>
        `${getEmojiToken((tokenData[i]?.symbol ?? "") as TokenEmojiKey)}${f}`,
    }
  )

  const embed = composeEmbedMessage(null, {
    title: `Recommended Earning with APY(%)`,
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
