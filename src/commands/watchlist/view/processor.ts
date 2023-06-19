import { MessageActionRow, MessageButton, User } from "discord.js"
import { getEmoji, getEmojiToken, TokenEmojiKey } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import community from "adapters/community"
import { getSlashCommand } from "utils/commands"
import { ResponseGetWatchlistResponse } from "types/api"
import { formatDigit } from "utils/defi"
import { VERTICAL_BAR } from "utils/constants"
import { groupBy } from "lodash"
import { renderChart } from "./chart"
import { paginationButtons } from "utils/router"

export function buildSwitchViewActionRow(currentView: string) {
  const tokenButton = new MessageButton({
    label: "Token",
    emoji: getEmoji("CASH"),
    customId: "view_watchlist",
    style: "SECONDARY",
    disabled: currentView === "token",
  })
  const nftButton = new MessageButton({
    label: "NFT",
    emoji: getEmoji("ANIMATED_GEM", true),
    customId: "view_nft",
    style: "SECONDARY",
    disabled: currentView === "nft",
  })
  const viewWalletBtn = new MessageButton({
    label: "Wallets",
    emoji: getEmoji("WALLET_1"),
    customId: "view_wallets",
    style: "SECONDARY",
  })
  const row = new MessageActionRow()
  row.addComponents([tokenButton, nftButton, viewWalletBtn])
  return row
}

const PAGE_SIZE = 16 as const
export enum WatchListViewType {
  Token = "token",
  Nft = "nft",
}
export enum WatchListTokenViewType {
  Text = "text",
  Chart = "chart",
}

function sortPrice(a: any, b: any) {
  const result =
    Math.abs(b.price_change_percentage_24h ?? 0) -
    Math.abs(a.price_change_percentage_24h ?? 0)

  return result >= 0 ? 1 : -1
}

export async function composeWatchlist(
  author: User,
  page = 0,
  view = WatchListViewType.Token,
  tokenView = WatchListTokenViewType.Text,
  user: User = author
) {
  const { data: res, ok } = await CacheManager.get({
    pool: "watchlist",
    key: `watchlist-${author.id}-${user.id}-${page}-${view}`,
    call: () =>
      view === WatchListViewType.Token
        ? defi.getUserWatchlist({ userId: user.id, page, size: PAGE_SIZE })
        : defi.getUserNFTWatchlist({ userId: user.id, size: PAGE_SIZE }),
    callIfCached: async () => {
      if (author.id) {
        await community.updateQuestProgress({
          userId: author.id,
          action: "watchlist",
        })
      }
    },
  })
  let data = []
  if (ok) {
    data = res.data
  }
  const embed = composeEmbedMessage(null, {
    author: [
      `${user.username}'s watchlist`,
      user.displayAvatarURL({ format: "png" }),
    ],
  })
  if (!data?.length) {
    embed.setDescription(
      `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} No items in your watchlist.Run ${await getSlashCommand(
        "watchlist add"
      )} to add one.\n\n`
    )
    return {
      msgOpts: {
        embeds: [embed],
        components: [buildSwitchViewActionRow(view)],
      },
    }
  }
  let files: any[] = []
  switch (view) {
    case WatchListViewType.Nft:
      // TODO
      embed.setDescription("NFT WIP")
      break
    default:
    case WatchListViewType.Token:
      {
        let tokenData = (data as ResponseGetWatchlistResponse["data"]) ?? []
        if (tokenView === WatchListTokenViewType.Text) {
          const group = groupBy(tokenData, (t) =>
            Math.sign(t.price_change_percentage_24h ?? 0)
          )
          group[1] = group[1]?.sort(sortPrice) ?? []
          group["-1"] = group["-1"]?.sort(sortPrice) ?? []

          tokenData = [...group[1], ...(group[0] ?? []), ...group[-1]]
          const { segments } = formatDataTable(
            tokenData.map((t) => {
              const price = t.current_price ?? 0
              return {
                symbol: (t.symbol ?? "").toUpperCase(),
                priceChange: `${formatDigit({
                  value: String(t.price_change_percentage_24h ?? 0),
                  fractionDigits: 2,
                })}%`,
                usd: `$${formatDigit({
                  value: String(price),
                  fractionDigits: price >= 100 ? 0 : 2,
                  scientificFormat: true,
                })}`,
              }
            }),
            {
              cols: ["symbol", "usd", "priceChange"],
              separator: [VERTICAL_BAR, VERTICAL_BAR],
              rowAfterFormatter: (f, i) =>
                `${getEmojiToken(
                  (tokenData[i].symbol ?? "") as TokenEmojiKey
                )}${f}${getEmoji(
                  (tokenData[i].price_change_percentage_24h ?? 0) < 0
                    ? "ARROW_DOWN"
                    : "ARROW_UP"
                )}`,
            }
          )

          embed.setDescription(
            `**${getEmoji(
              "CHART"
            )} All changes are in D1, sorted by price change**\n\n${segments
              .map((c) => c.join("\n"))
              .join("\n")}`
          )
        } else {
          embed.setImage("attachment://watchlist.png")
          files = [await renderChart(data)]
        }
      }
      break
  }
  return {
    context: {
      page,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        buildSwitchViewActionRow(view),
        ...paginationButtons(page, Math.ceil(res.metadata.total / PAGE_SIZE)),
      ],
      files,
    },
  }
}
