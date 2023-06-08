import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import {
  ColorResolvable,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
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

export type PageType = "index" | "profile" | "web3" | "dao" | "pay"

type HelpCommand = {
  commands: Array<{
    emoji: string
    name?: string
    value: string
    type: "slash" | "text"
    description: string
  }>
}

type HelpPage = {
  title: string
  category: Record<string, HelpCommand>
}

const allCommands: Record<Exclude<PageType, "index" | "profile">, HelpPage> = {
  web3: {
    title: "Web3 title",
    category: {},
  },
  dao: {
    title: "DAO title",
    category: {},
  },
  pay: {
    title: "Pay title",
    category: {},
  },
}

export const defaultPageType: Exclude<PageType, "profile"> = "index"

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
            label: "Profile",
            style: "SECONDARY",
            emoji: getEmoji("MOCHI_CIRCLE"),
            customId: "profile",
          }),
          new MessageButton({
            label: "Web3",
            style: "SECONDARY",
            customId: "web3",
            emoji: getEmoji("NFT2"),
          }),
          new MessageButton({
            label: "Pay",
            style: "SECONDARY",
            customId: "pay",
            emoji: getEmoji("ANIMATED_GEM", true),
          }),
          new MessageButton({
            label: "DAO",
            style: "SECONDARY",
            customId: "dao",
            emoji: getEmoji("PROPOSAL"),
          }),
        ])
  ),
]

export async function buildHelpInterface(
  embed: MessageEmbed,
  page: Exclude<PageType, "profile">
) {
  if (page === "index") {
    embed.setDescription(
      "Mochi is your Web3 assistant to maximize your earnings."
    )
    embed.addFields(
      {
        name: "\u200b\nGetting Started",
        value: [
          `<:_:1110865581617463346> ${await getSlashCommand(
            "profile"
          )} build up your profile`,
          `<:_:1093577916434104350> ${await getSlashCommand(
            "earn"
          )} like a chad`,
          `<a:_:854902183714619412> follow and copy top alphas`,
          `<a:_:902558994437144646> ${await getSlashCommand(
            "watchlist view"
          )} track your favorite tokens`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "For CM",
        value: [
          `<:_:850050324135673937> drive growth and engagement`,
          `<:_:885513214538952765> ${await getSlashCommand(
            "quest daily"
          )} engage your holders`,
          `${getEmoji("ANIMATED_OPEN_VAULT", true)} ${await getSlashCommand(
            "vault list"
          )} manage DAO treasuries`,
          `<:_:1093575214228574390> ${await getSlashCommand(
            "nftrole set"
          )} setup gated channels`,
          `<a:_:907658084296560721> ${await getSlashCommand(
            "sales list"
          )} buy/sell report`,
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
  } else {
    const commandsByCategory = allCommands[page]
    const groups = Object.entries(commandsByCategory.category)
    for await (const group of groups) {
      const [groupName, groupCommands] = group
      embed.addFields({
        name: groupName,
        value: `${(
          await Promise.all(
            groupCommands.commands.map(async (c) => {
              return `${c.emoji} ${
                c.type === "slash"
                  ? `${await getSlashCommand(c.value)}`
                  : `[\`$${c.value}\`](${HOMEPAGE_URL})`
              }: ${c.description}`
            })
          )
        ).join("\n")}`,
        inline: false,
      })
    }

    embed.setTitle(commandsByCategory.title)
  }

  embed.setColor(embedsColors.Game as ColorResolvable)
}
