import {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  User,
} from "discord.js"
import { emojis, getEmoji, getEmojiURL } from "utils/common"

export type TradeRequest = {
  offerItems: Set<string>
  wantItems: Set<string>
}

export type UserA = {
  id: string
  tag: string
  avatar: string | null
  confirmed: boolean
  cancelled: boolean
}

export type UserB = {
  id: string
  tag: string
  confirmed: boolean
  cancelled: boolean
}

export type SessionData = {
  threadId: string
  state: "trading" | "done" | "cancelled"
  userB: UserB
} & TradeRequest

type UserData = {
  userA: UserA
  // list of deals opened by user A, waiting for anyone to submit offer
  tradeRequests: Map<string, TradeRequest>
  // list of trading deals
  tradingDeals: Map<string, SessionData>
}

// user id -> UserData
export const session = new Map<string, UserData>()

const inSessionComponents = [
  new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId("trade-cancel")
      .setLabel("Cancel")
      .setStyle("DANGER"),
    new MessageButton()
      .setCustomId("trade-confirm")
      .setLabel("I've sent the item(s)")
      .setStyle("SUCCESS"),
  ]),
]

const getBeforeSessionComponents = (userId: string, requestId: string) => [
  new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId(`trade-offer_${userId}_${requestId}`)
      .setLabel("Offer")
      .setStyle("SECONDARY")
      .setEmoji("👋"),
  ]),
]

type RenderTradeRequestParams = {
  user: User
  requestId: string
  request: TradeRequest
}

export function renderTradeRequest(params: RenderTradeRequestParams) {
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
            value: `\n${Array.from(request.offerItems.values() ?? [])
              .map((i) => `> [${i}](https://getmochi.co)`)
              .join("\n")}`,
            inline: true,
          },
          {
            name: "Want",
            value: `\n${Array.from(request.wantItems?.values() ?? [])
              .map((i) => `> [${i}](https://getmochi.co)`)
              .join("\n")}`,
            inline: true,
          },
        ],
        footer: {
          text: user.tag,
          iconURL: user.avatarURL() ?? "",
        },
      }).setTimestamp(),
    ],
    components: getBeforeSessionComponents(user.id, requestId),
  }
}

type RenderTradeParams = {
  tradeId: string
  userData: UserData
}

export function renderTrade(params: RenderTradeParams): any | null {
  const { userData, tradeId } = params

  const sessionData = userData.tradingDeals.get(tradeId)
  if (!sessionData) return null

  const { userA } = userData
  const { userB, state, offerItems, wantItems } = sessionData

  let description = ""
  if (state === "trading") {
    description = `Deal will auto-cancel after 1 hour of inactivity.`
  } else if (state === "done") {
    description = "Trade finished"
  } else {
    description = "Trade cancelled"
  }

  const options: MessageOptions = {
    embeds: [
      new MessageEmbed({
        color: "#379c6f" as any,
        author: {
          name: "Trade",
          icon_url:
            state === "done" && userA.confirmed && userB.confirmed
              ? getEmojiURL(emojis["APPROVE"])
              : state === "cancelled"
              ? getEmojiURL(emojis["REVOKE"])
              : "",
        },
        thumbnail: {
          url: getEmojiURL(emojis["TRADE"]),
        },
        description,
        fields: [
          {
            name: `${
              userA.cancelled
                ? `${getEmoji("revoke")} `
                : userA.confirmed
                ? `${getEmoji("approve")} `
                : ""
            }**${userA.tag}**`,
            value: `${
              offerItems.size > 0
                ? `\n${Array.from(offerItems.values())
                    .map((i) => `> [${i}](https://getmochi.co)`)
                    .join("\n")}`
                : ``
            }`,
            inline: true,
          },
          {
            name: `${
              userB.cancelled
                ? `${getEmoji("revoke")} `
                : userB.confirmed
                ? `${getEmoji("approve")} `
                : ""
            }**${userB.tag}**`,
            value: `${
              (wantItems.size ?? 0) > 0
                ? `\n${Array.from(wantItems.values() ?? [])
                    .map((i) => `> [${i}](https://getmochi.co)`)
                    .join("\n")}`
                : `\n${Array.from(offerItems.values())
                    .map((i) => `> [${i}](https://getmochi.co)`)
                    .join("\n")}`
            }`,
            inline: true,
          },
        ],
        footer: {
          text: userA.tag,
          iconURL: userA.avatar ?? "",
        },
      }).setTimestamp(),
    ],
    components: inSessionComponents,
  }

  return options
}
