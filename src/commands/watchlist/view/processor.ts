import { MessageActionRow, MessageButton, User } from "discord.js"
import { getEmoji, getEmojiToken, TokenEmojiKey } from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import defi from "adapters/defi"
import community from "adapters/community"
import { getSlashCommand } from "utils/commands"
import { ResponseGetWatchlistResponse } from "types/api"
import { chunk, groupBy } from "lodash"
import { getProfileIdByDiscord } from "../../../utils/profile"
import { utils } from "@consolelabs/mochi-formatter"
import { VERTICAL_BAR } from "utils/constants"
import { renderChart } from "./chart"
import { paginationButtons } from "utils/router"
import { somethingWentWrongPayload } from "utils/error"
import { APIError } from "errors"

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
    label: "Wallet",
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

function sortPrice(dir: 1 | -1 = 1) {
  return function (a: any, b: any) {
    const result =
      Math.abs(b.price_change_percentage_24h ?? 0) -
      Math.abs(a.price_change_percentage_24h ?? 0)

    return (result >= 0 ? 1 : -1) * dir
  }
}

export async function composeWatchlist(
  author: User,
  page = 0,
  view = WatchListViewType.Token,
  tokenView = WatchListTokenViewType.Text,
  user: User = author,
) {
  switch (view) {
    case WatchListViewType.Nft:
      return await composeNFTWatchlist(author, page, user)
    case WatchListViewType.Token:
      return await composeTokenWatchlist(author, page, tokenView, user)
  }
}

async function composeTokenWatchlist(
  author: User,
  page = 0,
  tokenView = WatchListTokenViewType.Text,
  user: User = author,
) {
  const profileId = await getProfileIdByDiscord(user.id)
  const {
    data: res,
    ok,
    error,
    status = 500,
    curl,
    log,
  } = await defi.getUserWatchlist({ profileId })
  if (!ok) {
    throw new APIError({ error, status, description: log, curl })
  }
  let data = res.data
  if (author.id) {
    await community.updateQuestProgress({
      userId: author.id,
      action: "watchlist",
    })
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
        true,
      )} No items in your watchlist.Run ${await getSlashCommand(
        "watchlist add-nft",
      )} to add one.\n\n`,
    )
    return {
      msgOpts: {
        embeds: [embed],
        components: [buildSwitchViewActionRow(WatchListViewType.Token)],
      },
    }
  }
  let files: any[] = []
  // Pagination from frontend side, since we need to sort
  let tokenData = (data as ResponseGetWatchlistResponse["data"]) ?? []
  tokenData = tokenData.sort(
    (a, b) =>
      (b.price_change_percentage_24h ?? 0) -
      (a.price_change_percentage_24h ?? 0),
  )
  let chunkedTokenData = chunk(
    (data as ResponseGetWatchlistResponse["data"]) ?? [],
    PAGE_SIZE,
  )
  let totalPage = chunkedTokenData.length
  if (page >= totalPage) {
    return {
      msgOpts: {
        ...somethingWentWrongPayload(),
      },
    }
  }
  tokenData = chunkedTokenData[page]

  if (tokenView === WatchListTokenViewType.Text) {
    const { segments } = formatDataTable(
      tokenData.map((t) => {
        const price = t.current_price ?? 0
        const priceChange = t.price_change_percentage_24h ?? 0
        return {
          symbol: (t.symbol ?? "").toUpperCase(),
          priceChange: utils.formatPercentDigit(priceChange),
          usd: utils.formatUsdPriceDigit({
            value: price,
            subscript: true,
            shorten: false,
          }),
        }
      }),
      {
        cols: ["symbol", "usd", "priceChange"],
        separator: [VERTICAL_BAR, VERTICAL_BAR],
        rowAfterFormatter: (f, i) =>
          `${getEmojiToken(
            (tokenData[i].symbol ?? "") as TokenEmojiKey,
          )}${f}${getEmoji(
            (tokenData[i].price_change_percentage_24h ?? 0) < 0
              ? "ARROW_DOWN"
              : "ARROW_UP",
          )}`,
      },
    )

    embed.setDescription(
      `**${getEmoji(
        "CHART",
      )} All changes are in D1, sorted by price change**\n\n${segments
        .map((c) => c.join("\n"))
        .join("\n")}`,
    )
  } else {
    embed.setImage("attachment://watchlist.png")
    files = [await renderChart(tokenData)]
  }

  return {
    context: {
      page,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        buildSwitchViewActionRow(WatchListViewType.Token),
        ...paginationButtons(page, totalPage),
      ],
      files,
    },
  }
}

async function composeNFTWatchlist(
  author: User,
  page = 0,
  user: User = author,
) {
  const embed = composeEmbedMessage(null, {
    author: [
      `${user.username}'s watchlist`,
      user.displayAvatarURL({ format: "png" }),
    ],
    description: "NFT WIP",
  })

  return {
    context: {
      page,
    },
    msgOpts: {
      embeds: [embed],
      components: [buildSwitchViewActionRow(WatchListViewType.Nft)],
    },
  }
}
