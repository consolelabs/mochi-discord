import { Message, MessageEmbed } from "discord.js"
import {
  AIRDROP_GITBOOK,
  BALANCE_GITBOOK,
  DEFAULT_ROLE_GITBOOK,
  DEPOSIT_GITBOOK,
  GM_GITBOOK,
  HELP_GITBOOK,
  HOMEPAGE_URL,
  INVITE_GITBOOK,
  LEVEL_ROLE_GITBOOK,
  LOG_CHANNEL_GITBOOK,
  NFT_GITBOOK,
  NFT_ROLE_GITBOOK,
  PROFILE_GITBOOK,
  PRUNE_GITBOOK,
  REACTION_ROLE_GITBOOK,
  SALE_TRACKER_GITBOOK,
  STARBOARD_GITBOOK,
  STATS_GITBOOK,
  TELEGRAM_GITBOOK,
  TICKER_GITBOOK,
  TIP_GITBOOK,
  TOKEN_GITBOOK,
  TWITTER_WATCH_GITBOOK,
  VERIFY_WALLET_GITBOOK,
  VOTE_GITBOOK,
  WATCHLIST_GITBOOK,
  WELCOME_GITBOOK,
} from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { capFirst, getEmoji, thumbnails } from "utils/common"
import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

function getHelpEmbed(msg: Message) {
  return composeEmbedMessage(msg, {
    title: `Mochi Bot Commands`,
    author: ["Mochi Bot", thumbnails.HELP],
    image,
  })
}

const commands: Record<
  string,
  {
    emoji: string
    description: string
    features: Array<{
      value: string
      onlySlash?: boolean
      url: string
    }>
  }
> = {
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
  Vote: {
    emoji: getEmoji("like"),
    description: "Vote for us and earn more reward",
    features: [
      {
        value: "vote",
        url: VOTE_GITBOOK,
      },
    ],
  },
  "Server Insight": {
    emoji: getEmoji("prediction"),
    description: "Gain more server insight",
    features: [
      {
        value: "stats",
        url: STATS_GITBOOK,
      },
    ],
  },
  "Track NFT": {
    emoji: getEmoji("nfts"),
    description: "Check NFT rarity, sales, and ranking",
    features: [
      {
        value: "sales",
        url: SALE_TRACKER_GITBOOK,
      },
      {
        value: "nft",
        url: NFT_GITBOOK,
      },
    ],
  },
  Welcome: {
    emoji: "<:hello:899666094112010350>",
    description: "Automate welcome message",
    features: [
      {
        value: "welcome",
        url: WELCOME_GITBOOK,
        onlySlash: true,
      },
    ],
  },
  "Member Profile": {
    emoji: getEmoji("exp"),
    description: "Tracking member profile and ranking",
    features: [
      {
        value: "profile",
        url: PROFILE_GITBOOK,
      },
      {
        value: "top",
        url: HELP_GITBOOK + "&command=top",
      },
    ],
  },
  Community: {
    emoji: getEmoji("fellowship"),
    description: "Set up channels and other add-ins to facilitate activities",
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
    ],
  },
  "Server Member": {
    emoji: "<a:pepepolicedog:974757344900681758>",
    description: "Grow the number of members or remove inactive ones",
    features: [
      {
        value: "invite",
        url: INVITE_GITBOOK,
      },
      {
        value: "prune",
        url: PRUNE_GITBOOK,
      },
    ],
  },
  "Track Crypto": {
    emoji: "📈",
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
    ],
  },
  "Assign Role": {
    emoji: "<:pawlord:917358832269795388>",
    description: "Assign role for members based on different criteria",
    features: [
      {
        value: "defaultrole",
        url: DEFAULT_ROLE_GITBOOK,
      },
      {
        value: "reactionrole",
        url: REACTION_ROLE_GITBOOK,
      },
      {
        value: "levelrole",
        url: LEVEL_ROLE_GITBOOK,
      },
      {
        value: "nftrole",
        url: NFT_ROLE_GITBOOK,
      },
    ],
  },
}

export function buildHelpInterface(
  embed: MessageEmbed,
  version: "$" | "/" = "$"
) {
  Object.entries(commands)
    .filter((c) => {
      if (version === "$") {
        const [, cmdData] = c
        // if viewing text version but only slash available then exclude it out
        if (cmdData.features.every((f) => f.onlySlash)) return false
      }
      return true
    })
    .forEach((cmd) => {
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
}

const command: Command = {
  id: "help",
  command: "help",
  category: "Profile",
  brief: "Help Menu",
  run: async function (msg: Message) {
    const data = await this.getHelpMessage(msg)
    return { messageOptions: data }
  },
  getHelpMessage: async (msg: Message) => {
    const embed = getHelpEmbed(msg)
    buildHelpInterface(embed)
    embed.addFields(
      {
        name: "\u200b",
        value: getEmoji("blank"),
        inline: true,
      },
      {
        name: "**Examples**",
        value: `\`\`\`$help invite\`\`\``,
      },
      {
        name: "**Document**",
        value: `[**Gitbook**](${HELP_GITBOOK}&command=help)`,
        inline: true,
      },
      {
        name: "**Bring the Web3 universe to your Discord**",
        value: `[**Website**](${HOMEPAGE_URL})`,
        inline: true,
      }
    )

    return { embeds: [embed] }
  },
  allowDM: true,
  colorType: "Game",
}

export default command
