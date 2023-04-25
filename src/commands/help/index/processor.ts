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
  DEFAULT_BOT_INVITE_URL,
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
    title: "Welcome to Mochi!",
    author: ["mochi.gg", thumbnails.MOCHI],
    image,
    originalMsgAuthor: user,
  })
}

export type PageType =
  | "welcome"
  | "social"
  | "crypto"
  | "nft"
  | "dao_management"

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

const allCommands: Record<Exclude<PageType, "welcome">, HelpPage> = {
  social: {
    title: "Engage with your community & honor members",
    category: {
      Profile: {
        commands: [
          {
            value: "profile",
            type: "slash",
            description: "Tracking your profile",
            emoji: getEmoji("TREASURER"),
          },
          {
            value: "tagme",
            type: "slash",
            description: "Get DM whenever someone pings you",
            emoji: getEmoji("TREASURER"),
          },
          {
            value: "activity",
            type: "slash",
            description: "Trace back all of your activities",
            emoji: getEmoji("PROPOSAL"),
          },
          {
            value: "inbox",
            type: "slash",
            description: "Notification whenever you have notification ",
            emoji: getEmoji("ANIMATED_CHAT_2", true),
          },
          {
            value: "telegram",
            type: "text",
            description: "Link Telegram to your profile",
            emoji: getEmoji("TELEGRAM"),
          },
        ],
      },
      Earning: {
        commands: [
          {
            name: "quest daily",
            value: "quest",
            description: "Complete these tasks to earn more rewards",
            type: "slash",
            emoji: getEmoji("ANIMATED_CHEST", true),
          },
        ],
      },
      Feedback: {
        commands: [
          {
            value: "feedback",
            description: "Share your idea to help us improve Mochi Bot",
            type: "slash",
            emoji: getEmoji("ANIMATED_CHAT", true),
          },
        ],
      },
    },
  },
  crypto: {
    title: "Interact with Cryptocurrency right on Discord!",
    category: {
      "Track Crypto": {
        commands: [
          {
            name: "token list",
            value: "token",
            type: "slash",
            description: "Manage all available token in your server",
            emoji: getEmoji("ANIMATED_CHART_INCREASE", true),
          },
          {
            value: "ticker",
            type: "slash",
            description: "Check token price",
            emoji: getEmoji("TREASURER"),
          },
          {
            name: "watchlist view",
            value: "watchlist",
            type: "slash",
            description: "Track your portfolio",
            emoji: getEmoji("TOKEN_LIST"),
          },
          {
            value: "convert",
            type: "slash",
            description: "Convert an amount of one currency to another",
            emoji: getEmoji("SWAP_ROUTE"),
          },
          {
            value: "gas",
            type: "slash",
            description: "The gas fee list of all chain",
            emoji: getEmoji("GAS"),
          },
          {
            name: "alert list",
            value: "alert",
            type: "slash",
            description: "Get notification whenever the price changes",
            emoji: getEmoji("ANIMATED_BELL"),
          },
          {
            name: "wallet view",
            value: "wallet",
            type: "slash",
            description: "Connect your crypto wallets and track other's one",
            emoji: getEmoji("WALLET_1"),
          },
        ],
      },
      Transaction: {
        commands: [
          {
            value: "tip",
            type: "slash",
            description: "Send money to others",
            emoji: getEmoji("CASH"),
          },
          {
            value: "pay",
            type: "text",
            description: "Make payment request or pay other through a link",
            emoji: getEmoji("CASH"),
          },
          {
            value: "deposit",
            type: "slash",
            description: "Top up your Mochi bag",
            emoji: getEmoji("ANIMATED_MONEY", true),
          },
          {
            value: "withdraw",
            type: "slash",
            description: "Withdraw token to your crypto wallet",
            emoji: getEmoji("ANIMATED_WITHDRAW", true),
          },
          {
            value: "balances",
            type: "slash",
            description: "Check the balance of Mochi wallet",
            emoji: getEmoji("WALLET_1"),
          },
          {
            value: "airdrop",
            type: "slash",
            description: "Give away some tokens to your community",
            emoji: getEmoji("AIRDROP"),
          },
          {
            value: "swap",
            type: "slash",
            description: "Swap an amount of token to another",
            emoji: getEmoji("SWAP_ROUTE"),
          },
        ],
      },
    },
  },
  nft: {
    title: "Track multiple NFT collections in an instant",
    category: {
      "Track NFT": {
        commands: [
          {
            value: "nft",
            type: "text",
            description: "Check NFT rarity, sales, and ranking",
            emoji: getEmoji("NFT2"),
          },
          {
            name: "sales list",
            value: "sales",
            type: "slash",
            description: "Quickly catch up on NFT market movement",
            emoji: getEmoji("CONVERSION"),
          },
        ],
      },
    },
  },
  dao_management: {
    title: "Manage your Discord community with ease!",
    category: {
      "Automatic Onboarding": {
        commands: [
          {
            name: "welcome info",
            value: "welcome",
            type: "slash",
            description: "Send welcome message automatically",
            emoji: getEmoji("WAVING_HAND"),
          },
          {
            value: "levelmessage",
            type: "text",
            description:
              "Setup congratulation message when a user is leveled up",
            emoji: getEmoji("ANIMATED_ARROW_UP", true),
          },
        ],
      },
      "DAO Management": {
        commands: [
          {
            name: "verify info",
            value: "verify",
            type: "slash",
            description: "Setup a channel to verify users wallet",
            emoji: getEmoji("CHECK"),
          },
          {
            name: "proposal info",
            value: "proposal",
            type: "slash",
            description: "Post a proposal",
            emoji: getEmoji("PROPOSAL"),
          },
          {
            name: "vault list",
            value: "vault",
            type: "slash",
            description: "Setup a vault to keep the community money",
            emoji: getEmoji("ANIMATED_OPEN_VAULT", true),
          },
        ],
      },
      Community: {
        commands: [
          {
            name: "gm info",
            value: "gm",
            type: "slash",
            description:
              'Create a space to count streak for users saying "GM" everyday',
            emoji: getEmoji("WAVING_HAND"),
          },
          {
            value: "starboard",
            type: "text",
            description:
              "Share well-rated posts rated by community automatically",
            emoji: getEmoji("ANIMATED_STAR"),
          },
          {
            name: "config logchannel info",
            value: "config",
            type: "slash",
            description: "Create a channel to log all users activities",
            emoji: getEmoji("CONFIG"),
          },
          {
            name: "config currency",
            value: "config",
            type: "slash",
            description: "Setup a default currency to tip",
            emoji: getEmoji("ANIMATED_COIN_1", true),
          },
          {
            name: "config tiprange",
            value: "config",
            type: "slash",
            description: "Setup the minimum and maximum amount to tip",
            emoji: getEmoji("CASH"),
          },
        ],
      },
      "Assign Role": {
        commands: [
          {
            name: "defaultrole info",
            value: "defaultrole",
            type: "slash",
            description: "Grant role when a new user joins the server",
            emoji: getEmoji("TREASURER"),
          },
          {
            name: "reactionrole list",
            value: "reactionrole",
            type: "slash",
            description: "Grant role based on the message reaction",
            emoji: getEmoji("ANIMATED_HEART", true),
          },
          {
            name: "levelrole list",
            value: "levelrole",
            type: "slash",
            description: "Grant role when users level up",
            emoji: getEmoji("ANIMATED_BADGE_1", true),
          },
          {
            name: "xprole list",
            value: "xprole",
            type: "slash",
            description: "Use the XP range to grant role for users",
            emoji: getEmoji("ANIMATED_XP", true),
          },
          {
            name: "nftrole list",
            value: "nftrole",
            type: "slash",
            description: "Grant role by holding NFT",
            emoji: getEmoji("NFT2"),
          },
          {
            name: "tokenrole list",
            value: "tokenrole",
            type: "slash",
            description: "Grant role by holding token",
            emoji: getEmoji("ANIMATED_COIN_1", true),
          },
          {
            name: "mixrole list",
            value: "mixrole",
            type: "slash",
            description: "Combine different condition at once to grant role",
            emoji: getEmoji("ANIMATED_SHRUGGING", true),
          },
        ],
      },
    },
  },
}

export const defaultPageType: PageType = "welcome"

export const pagination = (currentPage: PageType) => [
  new MessageActionRow().addComponents(
    new MessageButton({
      label: "Welcome",
      emoji: getEmoji("WAVING_HAND"),
      style: "SECONDARY",
      customId: "welcome",
      disabled: currentPage === "welcome",
    }),
    new MessageButton({
      label: "Social",
      emoji: getEmoji("TREASURER"),
      style: "SECONDARY",
      customId: "social",
      disabled: currentPage === "social",
    }),
    new MessageButton({
      label: "Crypto",
      emoji: getEmoji("CHART"),
      style: "SECONDARY",
      customId: "crypto",
      disabled: currentPage === "crypto",
    }),
    new MessageButton({
      label: "NFT",
      emoji: getEmoji("NFT2"),
      style: "SECONDARY",
      customId: "nft",
      disabled: currentPage === "nft",
    })
  ),
  new MessageActionRow().addComponents(
    new MessageButton({
      label: "DAO Management",
      emoji: getEmoji("WEB"),
      style: "SECONDARY",
      customId: "dao_management",
      disabled: currentPage === "dao_management",
    })
  ),
]

export async function buildHelpInterface(embed: MessageEmbed, page: PageType) {
  if (page === "welcome") {
    embed.setDescription(
      "Bring Web3 universe to your Discord server.\n\nBuild the best growth tool for your Discord servers, and help you bring about and connect strong communities, active users with the ever-growing blockchain."
    )
    embed.addFields(
      {
        name: "\u200b\nStart Here",
        value: [
          `${getEmoji(
            "CHECK"
          )} Go [\`log in Mochi\`](${HOMEPAGE_URL}) to verify your wallet`,
          `${getEmoji("COMMAND")} Commands will start with \`$\` or \`/\``,
          `${getEmoji(
            "ANIMATED_ROBOT",
            true
          )} Invite Mochi bot to your server [\`get Mochi\`](${DEFAULT_BOT_INVITE_URL})`,
          `${getEmoji(
            "CONFIG"
          )} Start setting up your server with </admin:${await getSlashCommand(
            "admin"
          )}>`,
          `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Click each category below to explore all features`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "\u200b\n**Instructions**",
        value: `[**Gitbook**](${HELP_GITBOOK}&command=help)`,
        inline: true,
      },
      {
        name: "\u200b\nVisit our web",
        value: `[🌐](${HOMEPAGE_URL})`,
        inline: true,
      },
      {
        name: "\u200b\nJoin our community",
        value: `[${getEmoji("TWITTER")}](${TWITTER_URL})[${getEmoji(
          "DISCORD"
        )}](${DISCORD_URL})`,
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
                  ? `</${c.name ?? c.value}:${await getSlashCommand(c.value)}>`
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
