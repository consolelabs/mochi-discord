import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import {
  ColorResolvable,
  MessageActionRow,
  MessageButton,
  User,
} from "discord.js"
import { embedsColors } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { getEmoji, thumbnails } from "utils/common"
import {
  DISCORD_URL,
  HELP_GITBOOK,
  HOMEPAGE_URL,
  TWITTER_URL,
} from "utils/constants"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

export function getHelpEmbed(user: User) {
  return composeEmbedMessage(null, {
    author: ["Welcome to Mochi!", thumbnails.MOCHI],
    image,
    originalMsgAuthor: user,
  })
}

export type PageType = "index" | "quest" | "airdrop"

export const defaultPageType: Exclude<PageType, "earn"> = "index"

export const pagination = (currentPage: PageType) => [
  new MessageActionRow().addComponents(
    ...(currentPage !== "index"
      ? [
          new MessageButton({
            label: "Back",
            style: "SECONDARY",
            customId: "index",
          }),
        ]
      : [
          new MessageButton({
            label: "Quest",
            style: "SECONDARY",
            emoji: getEmoji("MOCHI_CIRCLE"),
            customId: "VIEW_QUESTS",
          }),
          new MessageButton({
            label: "Airdrop",
            style: "SECONDARY",
            customId: "VIEW_AIRDROPS",
            emoji: getEmoji("NFT2"),
          }),
        ])
  ),
]

export async function run(user: User) {
  const embed = composeEmbedMessage(null, {
    author: ["Welcome to Mochi!", thumbnails.MOCHI],
    image,
    originalMsgAuthor: user,
  })

  embed.setDescription(
    "Mochi is your Web3 assistant to maximize your earnings."
  )
  embed.addFields(
    {
      name: "\u200b\nGetting Started",
      value: [
        `<:_:1110865581617463346> ${await getSlashCommand(
          "quest daily"
        )} to check quest you can earn`,
        `<:_:1093577916434104350> ${await getSlashCommand(
          "drop"
        )} see the list airdrop you can join`,
      ].join("\n"),
      inline: false,
    },
    {
      name: "\u200b\n**Instructions**",
      value: `[**Gitbook**](${HELP_GITBOOK}&command=help)`,
      inline: true,
    },
    {
      name: "\u200b\nVisit our website",
      value: `[**Web**](${HOMEPAGE_URL})`,
      inline: true,
    },
    {
      name: "\u200b\nJoin our community",
      value: [
        `[**Twitter**](${TWITTER_URL})`,
        `[**Discord**](${DISCORD_URL})`,
      ].join("\n"),
      inline: true,
    }
  )
  embed.setColor(embedsColors.Game as ColorResolvable)

  return {
    msgOpts: {
      embeds: [embed],
      components: pagination(defaultPageType),
    },
  }
}
