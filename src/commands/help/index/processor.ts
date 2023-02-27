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
import { composeEmbedMessage, EMPTY_FIELD } from "ui/discord/embed"
import { capFirst, getEmoji, thumbnails } from "utils/common"
import {
  AIRDROP_GITBOOK,
  BALANCE_GITBOOK,
  DAO_VOTING_GITBOOK,
  DEPOSIT_GITBOOK,
  DISCORD_URL,
  FEEDBACK_GITBOOK,
  GM_GITBOOK,
  HELP_GITBOOK,
  HOMEPAGE_URL,
  JOIN_LEAVE_GITBOOK,
  LEVELUP_MESSAGE_GITBOOK,
  LOG_CHANNEL_GITBOOK,
  NFT_GITBOOK,
  PROFILE_GITBOOK,
  PRUNE_GITBOOK,
  QUEST_GITBOOK,
  SALE_TRACKER_GITBOOK,
  SENDXP_GITBOOK,
  STARBOARD_GITBOOK,
  TELEGRAM_GITBOOK,
  TICKER_GITBOOK,
  TIP_GITBOOK,
  TOKEN_GITBOOK,
  TOKEN_ROLE_GITBOOK,
  TOP_GITBOOK,
  TWITTER_URL,
  TWITTER_WATCH_GITBOOK,
  VERIFY_WALLET_GITBOOK,
  VOTE_GITBOOK,
  WALLET_GITBOOK,
  WATCHLIST_GITBOOK,
  WELCOME_GITBOOK,
} from "utils/constants"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

export function getHelpEmbed(user: User) {
  return composeEmbedMessage(null, {
    title: `Mochi Bot Commands`,
    author: ["Mochi Bot", thumbnails.HELP],
    image,
    originalMsgAuthor: user,
  })
}

export type PageType = "social" | "crypto_and_nft" | "server_management"

type HelpCommand = {
  emoji: string
  description: string
  features: Array<{
    value: string
    onlySlash?: boolean
    url: string
  }>
}

type HelpPage = {
  name: string
  example: string
  category: Record<string, HelpCommand>
}

const allCommands: Record<PageType, HelpPage> = {
  social: {
    name: "Social",
    example: "$vote\n$quest\n$feedback I love Mochi Watchlist",
    category: {
      "Earning Reward": {
        emoji: getEmoji("like"),
        description: "Complete these tasks to earn more rewards",
        features: [
          {
            value: "vote",
            url: VOTE_GITBOOK,
          },
          {
            value: "quest",
            url: QUEST_GITBOOK,
          },
        ],
      },
      "Member Profile": {
        emoji: getEmoji("exp"),
        description: "Tracking member profile",
        features: [
          {
            value: "profile",
            url: PROFILE_GITBOOK,
          },
          {
            value: "top",
            url: TOP_GITBOOK,
          },
        ],
      },
      Telegram: {
        emoji: "<:telegram:1026746501659103252>",
        description: "Link Telegram to Discord account",
        features: [
          {
            value: "telegram",
            url: TELEGRAM_GITBOOK,
          },
        ],
      },
      Feedback: {
        emoji: "<:message:1032608821534806056>",
        description: "Share your idea to help us improve Mochi Bot",
        features: [
          {
            value: "feedback",
            url: FEEDBACK_GITBOOK,
          },
        ],
      },
      "DAO Voting": {
        emoji: "<:conversation:1032608818930139249>",
        description: "Manage the voting decision process of DAO",
        features: [
          {
            value: "proposal",
            url: DAO_VOTING_GITBOOK,
          },
        ],
      },
    },
  },
  crypto_and_nft: {
    name: "Crypto & NFT",
    example: "$watchlist view\n$help nft",
    category: {
      "Track Crypto": {
        emoji: getEmoji("INCREASING"),
        description: "Tracking crypto market movements and opportunities",
        features: [
          {
            value: "tokens",
            url: TOKEN_GITBOOK,
          },
          {
            value: "ticker",
            url: TICKER_GITBOOK,
          },
          {
            value: "watchlist",
            url: WATCHLIST_GITBOOK,
          },
        ],
      },
      "Track NFT": {
        emoji: getEmoji("nfts"),
        description: "Checking NFT rarity, sales, and ranking",
        features: [
          {
            value: "nft",
            url: NFT_GITBOOK,
          },
        ],
      },
      Transaction: {
        emoji: getEmoji("tip"),
        description: "Making transactions among members and in your wallet",
        features: [
          {
            value: "tip",
            url: TIP_GITBOOK,
          },
          {
            value: "deposit",
            url: DEPOSIT_GITBOOK + "&command=deposit",
          },
          {
            value: "withdraw",
            url: DEPOSIT_GITBOOK + "&command=withdraw",
          },
          {
            value: "balances",
            url: BALANCE_GITBOOK,
          },
          {
            value: "airdrop",
            url: AIRDROP_GITBOOK,
          },
          {
            value: "monikers",
            url: "http://bit.ly/3K7Zf5S",
          },
          {
            value: "statements",
            url: "http://bit.ly/3XtBDvi",
          },
        ],
      },
      "Manage Wallet": {
        emoji: getEmoji("address"),
        description: "Tracking balance and transactions of different wallets",
        features: [
          {
            value: "wallet",
            url: WALLET_GITBOOK,
          },
        ],
      },
    },
  },
  server_management: {
    name: "Server Management",
    example: "$default role set\n$stats",
    category: {
      Verify: {
        emoji: getEmoji("approve"),
        description: "Verify your wallet",
        features: [
          {
            value: "verify",
            url: VERIFY_WALLET_GITBOOK,
          },
        ],
      },
      Welcome: {
        emoji: getEmoji("hello"),
        description: "Automate welcome message",
        features: [
          {
            value: "welcome",
            url: WELCOME_GITBOOK,
            onlySlash: true,
          },
        ],
      },
      "Server Member": {
        emoji: "<a:pepepolicedog:974757344900681758>",
        description: "Grow the number of members or remove inactive ones",
        features: [
          {
            value: "prune",
            url: PRUNE_GITBOOK,
          },
          {
            value: "joinleave",
            url: JOIN_LEAVE_GITBOOK,
          },
          {
            value: "levelmessage",
            url: LEVELUP_MESSAGE_GITBOOK,
          },
          {
            value: "welcome",
            url: WELCOME_GITBOOK,
            onlySlash: true,
          },
        ],
      },
      "Sales Update": {
        emoji: "<:mask:974519850644930582>",
        description: "Quick catch-up on NFT market movement",
        features: [
          {
            value: "sales",
            url: SALE_TRACKER_GITBOOK,
          },
        ],
      },
      Community: {
        emoji: getEmoji("fellowship"),
        description:
          "Set up channels and other add-ins to facilitate activities",
        features: [
          {
            value: "gm",
            url: GM_GITBOOK,
          },
          {
            value: "starboard",
            url: STARBOARD_GITBOOK,
          },
          {
            value: "log",
            url: LOG_CHANNEL_GITBOOK,
          },
          {
            value: "poe",
            url: TWITTER_WATCH_GITBOOK,
          },
          {
            value: "sendXP",
            url: SENDXP_GITBOOK,
          },
        ],
      },
      "Assign Role": {
        emoji: "<:pawlord:917358832269795388>",
        description: "Assign role for members based on different criteria",
        features: [
          {
            value: "defaultrole",
            url: "https://bit.ly/3kvRWui",
          },
          {
            value: "reactionrole",
            url: "http://bit.ly/3y1wX5r",
          },
          {
            value: "levelrole",
            url: "https://bit.ly/3ksKOyE",
          },
          {
            value: "nftrole",
            url: "http://bit.ly/41uedsP",
          },
          {
            value: "tokenrole",
            url: TOKEN_ROLE_GITBOOK,
          },
          {
            value: "xprole",
            url: "http://bit.ly/3xmi4KS",
          },
          {
            value: "mixrole",
            url: "https://bit.ly/40O5xxr", // field length limit 1024
          },
        ],
      },
    },
  },
}

export const defaultPageType: PageType = "crypto_and_nft"

export const pagination = (currentPage: PageType, isAdmin: boolean) => [
  new MessageActionRow().addComponents(
    new MessageButton({
      label: "Crypto & NFT",
      emoji: getEmoji("INCREASING"),
      style: "SECONDARY",
      customId: "crypto_and_nft",
      disabled: currentPage === "crypto_and_nft",
    }),
    new MessageButton({
      label: "Social",
      emoji: getEmoji("defi"),
      style: "SECONDARY",
      customId: "social",
      disabled: currentPage === "social",
    }),
    ...(isAdmin
      ? [
          new MessageButton({
            label: "Server Management",
            emoji: getEmoji("prediction"),
            style: "SECONDARY",
            customId: "server_management",
            disabled: currentPage === "server_management",
          }),
        ]
      : [])
  ),
]

export function buildHelpInterface(
  embed: MessageEmbed,
  page: PageType,
  isAdmin: boolean,
  version: "$" | "/" = "$"
) {
  const commandsByCategory =
    allCommands[
      !isAdmin && page === "server_management" ? defaultPageType : page
    ]
  const commands = Object.entries(commandsByCategory.category)
    .filter((c) => {
      if (version === "$" && c[1].features.every((f) => f.onlySlash))
        return false
      return true
    })
    .map<[string, HelpCommand]>((c) => {
      if (version === "$") {
        return [
          c[0],
          {
            ...c[1],
            features: c[1].features.filter((f) => !f.onlySlash),
          },
        ]
      }
      return c
    })
  commands?.forEach((cmd) => {
    const [cmdName, cmdData] = cmd
    embed.addFields({
      name: `${cmdData.emoji} ${capFirst(cmdName)}`,
      value: `${cmdData.features
        .map((f) => {
          return `[\`${version}${f.value}\`](${f.url})`
        })
        .join(" ")}\n${cmdData.description}`,
      inline: true,
    })
  })

  const missingCols = embed.fields.length % 3

  if (missingCols > 0) {
    embed.addFields(new Array(missingCols).fill(EMPTY_FIELD))
  }

  embed.addFields(
    {
      name: "**Examples**",
      value: `\`\`\`${commandsByCategory.example}\`\`\``,
    },
    {
      name: "**Instructions**",
      value: `[**Gitbook**](${HELP_GITBOOK}&command=help)`,
      inline: true,
    },
    {
      name: "Visit our Social Network",
      value: `[🌐](${HOMEPAGE_URL}) [${getEmoji("twitter")}](${TWITTER_URL})`,
      inline: true,
    },
    {
      name: "Join and build our community",
      value: `[${getEmoji("discord")}](${DISCORD_URL})`,
      inline: true,
    }
  )

  embed.setColor(embedsColors.Game as ColorResolvable)
}
