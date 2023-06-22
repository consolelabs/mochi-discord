import { capitalizeFirst } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import CacheManager from "cache/node-cache"
import community from "adapters/community"
import { formatDigit } from "utils/defi"
import { VERTICAL_BAR } from "utils/constants"
import { ApiEarningOption, ApiPlatform } from "types/krystal-api"
import { flatten } from "lodash"

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
      title: `Can not found`,
      description: `Can not found any earning options for ${token.toUpperCase()}`,
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
      { platform: "Platform", chain: "Chain", apy: "APY(%)" },
      ...tokenData.map((i: EarningPlatform) => {
        return {
          platform: capitalizeFirst((i.name || "").split("_").join(" ")),
          chain: i.chainName,
          apy:
            formatDigit({
              value: String(i.apy),
              fractionDigits: 2,
            }) + "%",
        }
      }),
    ],
    {
      cols: ["platform", "chain", "apy"],
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
