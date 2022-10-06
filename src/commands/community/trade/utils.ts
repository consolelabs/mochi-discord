import {
  EmbedFieldData,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
} from "discord.js"
import { emojis, getEmoji, getEmojiURL } from "utils/common"

type UserA = {
  id: string
  tag: string
  avatar: string | null
  offerItems: Set<string>
  wantItems?: Set<string>
  confirmed: boolean
  cancelled: boolean
}

type UserB = {
  id: string
  tag: string
  offerItems: Set<string>
  confirmed: boolean
  cancelled: boolean
}

export type SessionData =
  | {
      threadId: string
      state: "waiting"
      userA: UserA
      userB?: UserB
    }
  | {
      threadId: string
      state: "trading" | "done" | "cancelled"
      userA: UserA
      userB: UserB
    }

type UserData = {
  // trade id -> session data
  threads: Map<string, SessionData>
  // message id -> items id
  offeringItemsId: Map<string, Set<string>>
}

// user id -> UserData
export const session = new Map<string, UserData>()

const components = [
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

export function renderUI(userId: string, tradeId: string): any | null {
  const userData = session.get(userId)
  if (!userData) return null

  const sessionData = userData.threads.get(tradeId)
  if (!sessionData) return null

  const { userA, userB, state } = sessionData

  let description = ""
  if (state === "waiting") {
    description = `<@${userA.id}>'s items are open for trade, reply ${
      (userA.wantItems?.size ?? 0) > 0 ? "`$offer`" : "`$offer <item>`"
    } to this message to submit your offer.`
  } else if (state === "trading") {
    description = `Deal will auto-cancel after 1 hour of inactivity.`
  } else if (state === "done") {
    description = "Trade finished"
  } else {
    description = "Trade cancelled"
  }

  let fields: Array<EmbedFieldData> = []
  if (state === "waiting") {
    fields = [
      {
        name: "Have",
        value: `${
          (userA.offerItems?.size ?? 0) > 0
            ? `\n${Array.from(userA.offerItems?.values() ?? [])
                .map((i) => `> [${i}](https://getmochi.co)`)
                .join("\n")}`
            : ``
        }`,
        inline: true,
      },
      {
        name: "Want",
        value: `${`\n${Array.from(userA.wantItems?.values() ?? [])
          .map((i) => `> [${i}](https://getmochi.co)`)
          .join("\n")}`}`,
        inline: true,
      },
      {
        name: "Accept Platform",
        value: [
          "988748731857911878",
          "1024207812395544617",
          "1024207718338281514",
          "992327591220490350",
          "1007236418164236298",
        ]
          .map((e) => `<:_:${e}>`)
          .join(" "),
        inline: true,
      },
    ]
  } else {
    fields = [
      {
        name: `${
          userA.cancelled
            ? `${getEmoji("revoke")} `
            : userA.confirmed
            ? `${getEmoji("approve")} `
            : ""
        }**${userA.tag}**`,
        value: `${
          userA.offerItems.size > 0
            ? `\n${Array.from(userA.offerItems.values())
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
          (userA.wantItems?.size ?? 0) > 0
            ? `\n${Array.from(userA.wantItems?.values() ?? [])
                .map((i) => `> [${i}](https://getmochi.co)`)
                .join("\n")}`
            : `\n${Array.from(userB.offerItems.values())
                .map((i) => `> [${i}](https://getmochi.co)`)
                .join("\n")}`
        }`,
        inline: true,
      },
      {
        name: "Accept Platform",
        value: [
          "988748731857911878",
          "1024207812395544617",
          "1024207718338281514",
          "992327591220490350",
          "1007236418164236298",
        ]
          .map((e) => `<:_:${e}>`)
          .join(" "),
        inline: true,
      },
    ]
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
        fields,
        footer: {
          text: userA.tag,
          iconURL: userA.avatar ?? "",
        },
      }).setTimestamp(),
    ],
    ...(state === "trading" && { components }),
  }

  return options
}
