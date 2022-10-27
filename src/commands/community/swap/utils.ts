import Captcha from "@haileybot/captcha-generator"
import profile from "adapters/profile"
import { MessageActionRow, MessageButton, MessageEmbed, User } from "discord.js"
import { emojis, getEmojiURL, shortenHashOrAddress } from "utils/common"

type TradeRequest = {
  have_items: Array<{ address: string; token_ids: Array<string> }>
  want_items: Array<{ address: string; token_ids: Array<string> }>
}

export type UserA = {
  id: string
  tag: string
  address: string
}

type UserData = {
  userA: UserA
  // list of deals opened by user A
  tradeRequests: Map<string, TradeRequest>
}

export const newCaptcha = () => new Captcha()

// user id -> UserData
export const session = new Map<string, UserData>()

type RenderTradeRequestParams = {
  user: User
  requestId: string
  request: TradeRequest
}

export function renderTrade(params: RenderTradeRequestParams) {
  const { user, requestId, request } = params

  return {
    content: `> ${user} **wants to trade**`,
    embeds: [
      new MessageEmbed({
        color: "#379c6f" as any,
        author: {
          name: "Trade Request",
        },
        thumbnail: {
          url: getEmojiURL(emojis["TRADE"]),
        },
        description: `${user}'s items are open for trade, click button to submit your offer.`,
        fields: [
          {
            name: "Have",
            value: `\n${request.have_items
              .map((i) => {
                return `> ${shortenHashOrAddress(
                  i.address
                )}\n>     ${i.token_ids
                  .map((ti) => `Token ID ${ti}`)
                  .join("\n>     ")}`
              })
              .join("\n\n")}`,
            inline: true,
          },
          {
            name: "Want",
            value: `\n${request.want_items
              .map((i) => {
                return `> ${shortenHashOrAddress(
                  i.address
                )}\n>     ${i.token_ids
                  .map((ti) => `Token ID ${ti}`)
                  .join("\n>     ")}`
              })
              .join("\n\n")}`,
            inline: true,
          },
        ],
        footer: {
          text: user.tag,
          iconURL: user.avatarURL() ?? "",
        },
      }).setTimestamp(),
    ],
    components: [
      new MessageActionRow().addComponents([
        new MessageButton()
          .setCustomId(`trade-offer_${user.id}_${requestId}`)
          .setLabel("Offer")
          .setStyle("SECONDARY")
          .setEmoji("👋"),
      ]),
    ],
  }
}

export async function getInventory(address: string) {
  const collections = await profile.getUserNFTCollection({
    userAddress: address,
  })

  const tokensArr = await Promise.all(
    collections.data?.map(async (c) => {
      const res = await profile.getUserNFT({
        userAddress: address,
        collectionAddresses: [c.collection_address],
      })

      return res.data
    }) ?? []
  )

  const tokens = tokensArr.reduce<
    Record<
      string,
      { collectionName: string; collectionAddress: string; tokens: Array<any> }
    >
  >((acc, c) => {
    const colAddress = c?.[0].collection_address

    if (colAddress) {
      return {
        ...acc,
        [colAddress]: {
          collectionName:
            (acc[colAddress]?.collectionName ||
              collections.data?.find(
                (col) => col.collection_address === colAddress
              )?.name) ??
            "",
          collectionAddress: colAddress,
          tokens: [...(acc[colAddress]?.tokens ?? []), ...c],
        },
      }
    }
    return acc
  }, {})

  return tokens
}
