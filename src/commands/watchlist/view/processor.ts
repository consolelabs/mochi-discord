import { Message, MessageActionRow, MessageButton, User } from "discord.js"
import {
  authorFilter,
  getEmoji,
  getEmojiToken,
  TokenEmojiKey,
} from "utils/common"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import defi from "adapters/defi"
import CacheManager from "cache/node-cache"
import community from "adapters/community"
import { getSlashCommand } from "utils/commands"
import { ResponseGetWatchlistResponse } from "types/api"
import { formatDigit } from "utils/defi"
import { APPROX, VERTICAL_BAR } from "utils/constants"
import { wrapError } from "utils/wrap-error"
import {
  render as renderTrackingWallets,
  collectSelection as collectViewWalletSelection,
} from "../../wallet/list/processor"

// async function renderWatchlist(data: any[]) {
//   const container: RectangleStats = {
//     x: {
//       from: 0,
//       to: 900,
//     },
//     y: {
//       from: 0,
//       to: 780,
//     },
//     w: 0,
//     h: 0,
//     pt: 50,
//     pl: 10,
//     radius: 0,
//     bgColor: "rgba(0, 0, 0, 0)",
//   }
//   container.w = container.x.to - container.x.from
//   container.h = container.y.to - container.y.from
//   const canvas = createCanvas(container.w, container.h)
//   const ctx = canvas.getContext("2d")
//   drawRectangle(ctx, container, container.bgColor)
//
//   const ascColor = "#56c9ac"
//   const descColor = "#ed5565"
//   const itemContainer: RectangleStats = {
//     x: {
//       from: 0,
//       to: 0,
//     },
//     y: {
//       from: 0,
//       to: 120,
//     },
//     mt: 10,
//     w: 0,
//     h: 120,
//     pt: 20,
//     pl: 15,
//     radius: 7,
//     bgColor: "#202020",
//   }
//   for (const [idx, item] of Object.entries(data)) {
//     const leftCol = +idx % 2 === 0
//     itemContainer.x = {
//       from: leftCol ? 0 : 455,
//       to: leftCol ? 445 : 900,
//     }
//     drawRectangle(ctx, itemContainer, itemContainer.bgColor)
//     const {
//       symbol,
//       current_price,
//       sparkline_in_7d,
//       price_change_percentage_7d_in_currency,
//       image,
//       is_pair,
//     } = item
//     let imageUrl = image
//     // image
//     const radius = 20
//     const imageX = itemContainer.x.from + (itemContainer.pl ?? 0)
//     const imageY = itemContainer.y.from + (itemContainer.pt ?? 0)
//     // if no imageUrl then find and use discord emoji URL
//     if (!imageUrl && is_pair) {
//       const [base, target] = symbol
//         .split("/")
//         .map((s: string) => emojis[s.toUpperCase() as EmojiKey])
//       imageUrl =
//         base && target
//           ? [getEmojiURL(base), getEmojiURL(target)].join("||")
//           : ""
//     }
//     if (imageUrl) {
//       const imageStats = {
//         radius,
//       }
//       if (!is_pair) {
//         const image = await loadAndCacheImage(imageUrl, radius * 2, radius * 2)
//         drawCircleImage({
//           ctx,
//           image,
//           stats: {
//             x: imageX + radius,
//             y: imageY + radius,
//             ...imageStats,
//           },
//         })
//       } else {
//         const imageUrls = imageUrl.split("||")
//         const baseImage = await loadAndCacheImage(
//           imageUrls[0],
//           radius * 2,
//           radius * 2
//         )
//         drawCircleImage({
//           ctx,
//           stats: {
//             x: imageX + radius,
//             y: imageY + radius,
//             ...imageStats,
//           },
//           image: baseImage,
//         })
//         const targetImage = await loadAndCacheImage(
//           imageUrls[1],
//           radius * 2,
//           radius * 2
//         )
//         drawCircleImage({
//           ctx,
//           stats: {
//             x: imageX + radius * 2.5,
//             y: imageY + radius,
//             ...imageStats,
//           },
//           image: targetImage,
//         })
//       }
//     }
//
//     // symbol
//     ctx.font = "bold 29px"
//     ctx.fillStyle = "white"
//     const symbolText = symbol.toUpperCase()
//     const symbolH = heightOf(ctx, symbolText)
//     const symbolX = imageX + radius * (is_pair ? 3.5 : 2) + 10
//     const symbolY = imageY + radius + symbolH / 2
//     ctx.fillText(symbolText, symbolX, symbolY)
//
//     // price
//     ctx.font = "bold 30px"
//     ctx.fillStyle = "white"
//     const currentPrice = `${
//       is_pair ? "" : "$"
//     }${current_price.toLocaleString()}`
//     const priceW = widthOf(ctx, currentPrice)
//     const priceH = heightOf(ctx, currentPrice)
//     const priceX = imageX
//     const priceY = imageY + priceH + radius * 2 + 10
//     ctx.fillText(currentPrice, priceX, priceY)
//
//     // 7d change percentage
//     ctx.font = "25px"
//     ctx.fillStyle =
//       price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor
//     const change = `${
//       price_change_percentage_7d_in_currency >= 0 ? "+" : ""
//     }${price_change_percentage_7d_in_currency.toFixed(2)}%`
//     const changeX = priceX + priceW + 10
//     const changeY = priceY
//     ctx.fillText(change, changeX, changeY)
//
//     // 7d chart
//     const { price } = sparkline_in_7d
//     const labels = price.map((p: number) => `${p}`)
//     const buffer = await renderChartImage({
//       labels,
//       data: price,
//       lineOnly: true,
//       colorConfig: {
//         borderColor:
//           price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor,
//         backgroundColor: "#fff",
//       },
//     })
//     const chart = await loadImage(buffer)
//     const chartW = 150
//     const chartH = 50
//     const chartX = itemContainer.x.to - chartW - 15
//     const chartY = itemContainer.y.from + (itemContainer.pt ?? 0) + chartH / 2
//     ctx.drawImage(chart, chartX, chartY, chartW, chartH)
//
//     // next row
//     if (!leftCol) {
//       itemContainer.y.from += itemContainer.h + (itemContainer.mt ?? 0)
//       itemContainer.y.to = itemContainer.y.from + itemContainer.h
//     }
//   }
//
//   return new MessageAttachment(canvas.toBuffer(), "watchlist.png")
// }

// async function renderNFTWatchlistChart(data: any[]) {
//   const container: RectangleStats = {
//     x: {
//       from: 0,
//       to: 900,
//     },
//     y: {
//       from: 0,
//       to: 780,
//     },
//     w: 0,
//     h: 0,
//     pt: 50,
//     pl: 10,
//     radius: 0,
//     bgColor: "rgba(0, 0, 0, 0)",
//   }
//   container.w = container.x.to - container.x.from
//   container.h = container.y.to - container.y.from
//   const canvas = createCanvas(container.w, container.h)
//   const ctx = canvas.getContext("2d")
//   drawRectangle(ctx, container, container.bgColor)
//
//   const ascColor = "#56c9ac"
//   const descColor = "#ed5565"
//   const itemContainer: RectangleStats = {
//     x: {
//       from: 0,
//       to: 0,
//     },
//     y: {
//       from: 0,
//       to: 120,
//     },
//     mt: 10,
//     w: 0,
//     h: 120,
//     pt: 20,
//     pl: 15,
//     radius: 7,
//     bgColor: "#202020",
//   }
//   for (const [idx, item] of Object.entries(data)) {
//     const leftCol = +idx % 2 === 0
//     itemContainer.x = {
//       from: leftCol ? 0 : 455,
//       to: leftCol ? 445 : 900,
//     }
//     drawRectangle(ctx, itemContainer, itemContainer.bgColor)
//     const {
//       symbol,
//       floor_price,
//       sparkline_in_7d,
//       price_change_percentage_24h,
//       price_change_percentage_7d_in_currency,
//       token,
//     } = item
//     // image
//     const radius = 20
//     const image = await loadAndCacheImage(item.image, radius * 2, radius * 2)
//     const imageX = itemContainer.x.from + (itemContainer.pl ?? 0)
//     const imageY = itemContainer.y.from + (itemContainer.pt ?? 0)
//     if (image) ctx.drawImage(image, imageX, imageY, radius * 2, radius * 2)
//
//     // symbol
//     ctx.font = "bold 29px"
//     ctx.fillStyle = "white"
//     const symbolText = symbol.toUpperCase()
//     const symbolH = heightOf(ctx, symbolText)
//     const symbolX = imageX + radius * 2 + 10
//     const symbolY = imageY + radius + symbolH / 2
//     ctx.fillText(symbolText, symbolX, symbolY)
//
//     // Token logo
//     const fallbackTokenLogoURL = "https://i.imgur.com/2MdXSOd.png"
//     const tokenEmojiId =
//       tokenEmojis[(token?.symbol as TokenEmojiKey) ?? ""] ?? ""
//     const tokenLogoURL = getEmojiURL(tokenEmojiId)
//     const tokenH = 25
//     const tokenW = 25
//     const tokenLogo = await loadAndCacheImage(
//       tokenEmojiId ? tokenLogoURL : fallbackTokenLogoURL,
//       tokenW,
//       tokenH
//     )
//     const tokenX = imageX
//     const tokenY = imageY + tokenH + radius + 20
//     if (tokenLogo) ctx.drawImage(tokenLogo, tokenX, tokenY, tokenW, tokenH)
//
//     // price
//     ctx.font = "bold 30px"
//     ctx.fillStyle = "white"
//     const currentPrice = `${floor_price}`
//     const priceW = widthOf(ctx, currentPrice)
//     const priceH = heightOf(ctx, currentPrice)
//     const priceX = tokenX + tokenW + 5
//     const priceY = tokenY + priceH
//     ctx.fillText(currentPrice, priceX, priceY)
//
//     // 24h change
//     ctx.font = "25px"
//     ctx.fillStyle = price_change_percentage_24h >= 0 ? ascColor : descColor
//     const change = `${
//       price_change_percentage_24h >= 0 ? "+" : ""
//     }${price_change_percentage_24h.toFixed(2)}%`
//     const changeX = priceX + priceW + 10
//     const changeY = priceY
//     ctx.fillText(change, changeX, changeY)
//
//     // 7d chart
//     const { price } = sparkline_in_7d
//     const labels = price.map((p: number) => `${p}`)
//     const buffer = await renderChartImage({
//       labels,
//       data: price,
//       lineOnly: true,
//       colorConfig: {
//         borderColor:
//           price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor,
//         backgroundColor: "#fff",
//       },
//     })
//     const chart = await loadImage(buffer)
//     const chartW = 150
//     const chartH = 50
//     const chartX = itemContainer.x.to - chartW - 15
//     const chartY = itemContainer.y.from + (itemContainer.pt ?? 0) + chartH / 2
//     ctx.drawImage(chart, chartX, chartY, chartW, chartH)
//
//     // next row
//     if (!leftCol) {
//       itemContainer.y.from += itemContainer.h + (itemContainer.mt ?? 0)
//       itemContainer.y.to = itemContainer.y.from + itemContainer.h
//     }
//   }
//
//   return new MessageAttachment(canvas.toBuffer(), "watchlist.png")
// }

export function buildSwitchViewActionRow(currentView: string) {
  const tokenButton = new MessageButton({
    label: "Token",
    emoji: getEmoji("CASH"),
    customId: "watchlist_switch-view_token",
    style: "SECONDARY",
    disabled: currentView === "token",
  })
  const nftButton = new MessageButton({
    label: "NFT",
    emoji: getEmoji("ANIMATED_GEM", true),
    customId: "watchlist_switch-view_nft",
    style: "SECONDARY",
    disabled: currentView === "nft",
  })
  const viewWalletBtn = new MessageButton({
    label: "Wallets",
    emoji: getEmoji("WALLET_1"),
    customId: "watchlist_goto_wallets",
    style: "SECONDARY",
  })
  const row = new MessageActionRow()
  row.addComponents([tokenButton, nftButton, viewWalletBtn])
  return row
}

async function switchView() {}
export async function collectButton(
  reply: Message,
  author: User,
  user: User = author
) {
  reply
    .createMessageComponentCollector({
      componentType: "BUTTON",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }

        const [cmd, action, view] = i.customId.split("_")

        if (cmd.startsWith("watchlist")) {
          switch (action) {
            case "goto": {
              switch (view) {
                case "wallets": {
                  const messageOptions = await renderTrackingWallets(user)
                  messageOptions.components.push(
                    new MessageActionRow().addComponents(
                      new MessageButton()
                        .setLabel("Back")
                        .setStyle("SECONDARY")
                        .setCustomId("back")
                    )
                  )
                  const edited = (await i.editReply(messageOptions)) as Message

                  collectViewWalletSelection(reply, i.user)

                  edited
                    .createMessageComponentCollector({
                      componentType: "BUTTON",
                      filter: authorFilter(author.id),
                      time: 300000,
                    })
                    .on("collect", async (i) => {
                      if (!i.deferred) {
                        await i.deferUpdate().catch(() => null)
                      }
                      wrapError(reply, async () => {
                        if (i.customId === "back") {
                          await i.editReply({
                            embeds: reply.embeds,
                            components: reply.components,
                          })
                        }
                      })
                    })
                    .on("end", () => {
                      wrapError(reply, async () => {
                        await i.editReply({ components: [] }).catch(() => null)
                      })
                    })
                  break
                }
                default:
                  break
              }
              break
            }
            default:
            case "switch-view":
              break
          }
        }
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}

const PAGE_SIZE = 16 as const
export enum WatchListViewType {
  TOKEN = "token",
  NFT = "nft",
}

export async function composeWatchlist(
  author: User,
  page: number,
  view: WatchListViewType,
  user: User = author
) {
  const { data: res, ok } = await CacheManager.get({
    pool: "watchlist",
    key: `watchlist-${author.id}-${page}-${view}`,
    call: () =>
      view === WatchListViewType.TOKEN
        ? defi.getUserWatchlist({ userId: user.id, page, size: PAGE_SIZE })
        : defi.getUserNFTWatchlist({ userId: user.id, size: 12 }),
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
      embeds: [embed],
      components: [buildSwitchViewActionRow("token")],
    }
  }
  switch (view) {
    case WatchListViewType.NFT:
      break
    default:
    case WatchListViewType.TOKEN:
      {
        let tokenData = (data as ResponseGetWatchlistResponse["data"]) ?? []
        tokenData = tokenData.sort(
          (a, b) =>
            Math.abs(b.price_change_percentage_24h ?? 0) -
            Math.abs(a.price_change_percentage_24h ?? 0)
        )
        const { segments } = formatDataTable(
          tokenData.map((t) => ({
            symbol: (t.symbol ?? "").toUpperCase(),
            priceChange: `${formatDigit({
              value: String(t.price_change_percentage_24h ?? 0),
              fractionDigits: 2,
            })}%`,
            usd: `$${formatDigit({
              value: String(t.current_price ?? "0"),
              fractionDigits: 2,
            })}`,
          })),
          {
            cols: ["symbol", "usd", "priceChange"],
            separator: [VERTICAL_BAR, APPROX],
            rowAfterFormatter: (f, i) =>
              `${getEmojiToken(
                (tokenData[i].symbol ?? "") as TokenEmojiKey
              )} ${f}${getEmoji(
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
      }
      break
  }
  return {
    embeds: [embed],
    components: [buildSwitchViewActionRow("token")],
  }
}
