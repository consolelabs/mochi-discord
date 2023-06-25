import { getEmojiToken, TokenEmojiKey } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import CacheManager from "cache/node-cache"
import community from "adapters/community"
import { formatDigit } from "utils/defi"
import { VERTICAL_BAR } from "utils/constants"
import { paginationButtons } from "utils/router"
import { ApiEarningOption } from "types/krystal-api"
import { chunk, groupBy, uniq } from "lodash"
import { InternalError } from "errors"
import {
  ButtonInteraction,
  CommandInteraction,
  SelectMenuInteraction,
} from "discord.js"

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
    ]).join(" ~ ")
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
      separator: [VERTICAL_BAR, VERTICAL_BAR],
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
