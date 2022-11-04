import {
  ColorResolvable,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js"
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
  QUEST_GITBOOK,
} from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { capFirst, getEmoji, thumbnails } from "utils/common"
import { Command, embedsColors } from "types/common"
import { composeEmbedMessage, EMPTY_FIELD } from "utils/discordEmbed"
import chunk from "lodash.chunk"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

const PAGE_SIZE = 6

function getHelpEmbed(msg: Message) {
  return composeEmbedMessage(msg, {
    title: `Mochi Bot Commands`,
    author: ["Mochi Bot", thumbnails.HELP],
    image,
  })
}

const _commands: Record<
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

const textCommands = chunk(
  Object.entries(_commands).filter((c) =>
    c[1].features.every((f) => !f.onlySlash)
  ),
  PAGE_SIZE
)

const slashCommands = chunk(Object.entries(_commands), PAGE_SIZE)

export const pagination = (currentPage: number, version: "$" | "/" = "$") => [
  new MessageActionRow().addComponents(
    new Array(version === "$" ? textCommands.length : slashCommands.length)
      .fill(0)
      .map(
        (_, i) =>
          new MessageButton({
            customId: `${i + 1}`,
            style: "SECONDARY",
            label: `Page ${i + 1}`,
            disabled: i + 1 === currentPage,
          })
      )
  ),
]

export function buildHelpInterface(
  embed: MessageEmbed,
  page: number,
  version: "$" | "/" = "$"
) {
  const commands = version === "$" ? textCommands : slashCommands
  const length = commands[page - 1]?.length ?? PAGE_SIZE
  commands[page - 1]?.forEach((cmd) => {
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

  const missingCols = PAGE_SIZE % length

  if (missingCols > 0) {
    embed.addFields(new Array(missingCols).fill(EMPTY_FIELD))
  }

  embed.addFields(
    {
      name: "**Examples**",
      value: `\`\`\`${version}help invite\`\`\``,
    },
    {
      name: "**Feedback**",
      value: `You can send feedbacks to the team to improve Mochi Bot\`\`\`${version}feedback I really like Mochi Bot's watch list feature\`\`\``,
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

  embed.setColor(embedsColors.Game as ColorResolvable)
}

const command: Command = {
  id: "help",
  command: "help",
  category: "Profile",
  brief: "Help Menu",
  run: async function (msg: Message) {
    await this.getHelpMessage(msg)
    return null
  },
  getHelpMessage: async (msg: Message) => {
    const embed = getHelpEmbed(msg)
    buildHelpInterface(embed, 1)

    const replyMsg = await msg.reply({
      embeds: [embed],
      components: pagination(1),
    })

    replyMsg
      .createMessageComponentCollector({
        filter: (i) => i.user.id === msg.author.id,
      })
      .on("collect", (i) => {
        i.deferUpdate()
        const pageNum = Number(i.customId)
        const embed = getHelpEmbed(msg)
        buildHelpInterface(embed, pageNum)

        replyMsg
          .edit({
            embeds: [embed],
            components: pagination(pageNum),
          })
          .catch(() => null)
      })
      .on("end", () => {
        replyMsg.edit({ components: [] }).catch(() => null)
      })

    return {}
  },
  allowDM: true,
  colorType: "Game",
}

export default command
