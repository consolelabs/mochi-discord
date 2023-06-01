import profile from "adapters/profile"
import {
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  capitalizeFirst,
  EmojiKey,
  getEmoji,
  getEmojiToken,
  isAddress,
  msgColors,
  reverseLookup,
  shortenHashOrAddress,
} from "utils/common"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_PROFILE,
  MOCHI_APP_SERVICE,
  TWITTER_USER_URL,
  TELEGRAM_USER_URL,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"
import {
  BalanceType,
  formatView,
  getBalances,
} from "commands/balances/index/processor"
import { formatDigit } from "utils/defi"
import config from "adapters/config"
import { formatVaults } from "commands/vault/list/processor"
import CacheManager from "cache/node-cache"
import { getSlashCommand } from "utils/commands"

async function renderListWallet(
  emoji: string,
  title: string,
  wallets: { value: string; chain?: string; total?: number }[],
  offset: number,
  showCash: boolean
) {
  if (!wallets.length) return ""
  const domains = await Promise.all(
    wallets.map(async (w) => await reverseLookup(w.value))
  )

  return `${emoji}${title}\n${
    formatDataTable(
      wallets.map((w, i) => ({
        chain: (w.chain || isAddress(w.value).type).toUpperCase(),
        address: domains[i] || shortenHashOrAddress(w.value, 3, 4),
        balance: w.total?.toString() ? `$${w.total.toString()}` : "",
      })),
      {
        cols: ["chain", "address", "balance"],
        rowAfterFormatter: (formatted, i) =>
          `${getEmoji(`NUM_${i + 1 + offset}` as EmojiKey)}${formatted}${
            showCash ? getEmoji("CASH") : ""
          } `,
      }
    ).joined
  }`
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" })
const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
])

async function compose(
  msg: OriginalMessage,
  member: GuildMember,
  dataProfile: any
) {
  const [podProfileRes, vaultsRes, walletsRes, socials, balances] =
    await Promise.all([
      profile.getUserProfile(msg.guildId ?? "", member.user.id),
      config.vaultList(msg.guildId ?? "", false, dataProfile.id),
      profile.getUserWallets(member.id),
      profile.getUserSocials(member.id),
      getBalances(
        dataProfile.id,
        member.user.id,
        BalanceType.Offchain,
        msg,
        "",
        ""
      ),
    ])
  if (!podProfileRes.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      description: podProfileRes.log,
      curl: podProfileRes.curl,
    })
  }
  const userProfile = podProfileRes.data

  const vaults = vaultsRes.slice(0, 5)

  const { onchainTotal, mochiWallets, wallets: _wallets, pnl } = walletsRes
  const wallets = _wallets.slice(0, 10)
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp
  const highestRole =
    member.roles.highest.name !== "@everyone" ? member.roles.highest : "N/A"

  const { totalWorth } = formatView("compact", "filter-dust", balances.data)
  const grandTotal = formatDigit({
    value: String(totalWorth + onchainTotal),
    fractionDigits: 2,
  })
  const mochiBal = formatDigit({
    value: totalWorth.toString(),
    fractionDigits: 2,
  })

  const { data: inbox } = await CacheManager.get({
    pool: "user_inbox",
    key: `${member.user.id}_0`,
    call: async () => await profile.getUserActivities(dataProfile.id),
  })
  const unreadList = inbox.filter((activity: any) => {
    return activity.status === "new"
  })

  const embed = composeEmbedMessage(null, {
    author: [
      member.nickname || member.displayName,
      member.user.displayAvatarURL(),
    ],
    color: msgColors.BLUE,
    description: `${getEmoji("LEAF")}\`Role. \`${highestRole}\n${getEmoji(
      "CASH"
    )}\`Balance. $${grandTotal}\`(${getEmoji(
      pnl.split("")[0] === "-" ? "ANIMATED_ARROW_DOWN" : "ANIMATED_ARROW_UP",
      true
    )} ${formatDigit({
      value: pnl.slice(1),
      fractionDigits: 2,
    })}%)\n${getEmoji("ANIMATED_BADGE_1", true)}\`Lvl. ${
      userProfile.current_level?.level ?? "N/A"
    } (${userProfile.guild_rank ?? 0}${suffixes.get(
      pr.select(userProfile.guild_rank ?? 0)
    )})\`\n${getEmoji("XP")}\`Exp. ${userProfile.guild_xp}/${nextLevelMinXp}\``,
  }).addFields([
    {
      name: "Wallets",
      value: await renderWallets({
        mochiWallets: {
          data: mochiWallets,
          title: `\`Mochi ($${mochiBal})\`${getEmoji("CASH")}`,
        },
        wallets: {
          data: wallets,
        },
      }),
      inline: false,
    },
    ...(vaults.length
      ? [
          {
            name: "Vaults",
            value: formatVaults(vaults),
            inline: false,
          },
        ]
      : []),
    ...(socials.length
      ? [
          {
            name: "Socials",
            value: await renderSocials(socials),
            inline: false,
          },
        ]
      : []),
    ...(unreadList.length
      ? [
          {
            name:
              `<:_:1028964391690965012> You have \`${unreadList.length}\` unread message` +
              (unreadList.length > 1 ? "s" : ""),
            value: `Use ${await getSlashCommand("inbox")}.`,
          },
        ]
      : []),
  ])
  return {
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setPlaceholder(`💰 View wallet/vault`)
          .setCustomId("view_wallet_vault")
          .addOptions(
            [
              {
                value: "wallet_mochi_Mochi Wallet",
                type: "wallet",
                usd: mochiBal,
                chain: "",
              },
              ...wallets.map((w) => ({
                ...w,
                value: `wallet_onchain_${w.value}`,
                type: "wallet",
                usd: w.total,
              })),
              ...vaults.map((v) => ({
                ...v,
                type: "vault",
                value: `vault_${v.name}`,
                usd: v.total,
              })),
            ].map((w, i) => {
              const isMochi = w.value.split("_")[1] === "mochi"
              const address = w.value.split("_")[2]
              let label = ""
              if (w.type === "wallet") {
                label = `${isMochi ? "🔸  " : "🔹  "}${w.chain} | ${
                  isMochi ? address : shortenHashOrAddress(address, 3, 4)
                } | 💵 $${w.usd}`
              } else {
                label = `◽ ${w.name} | 💵 $${w.usd}`
              }

              return {
                emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
                label,
                value: w.value,
              }
            })
          )
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("QR")
          .setEmoji(getEmoji("QRCODE"))
          .setCustomId("view_qrcodes"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Quest")
          .setEmoji("<a:brrr:902558248907980871>")
          .setCustomId("view_quests"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Watchlist")
          .setEmoji(getEmoji("ANIMATED_STAR", true))
          .setCustomId("view_watchlist"),
        new MessageButton()
          .setLabel(`Connect Wallet`)
          .setEmoji(getEmoji("WALLET_1"))
          .setStyle("SECONDARY")
          .setCustomId("view_add_wallet")
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle("SECONDARY")
          .setEmoji(getEmojiToken("BNB"))
          .setLabel("Connect Binance")
          .setCustomId("profile_connect-binance"),
        ...["twitter", "telegram"]
          .filter((s) =>
            socials.every((connectedSocial) => connectedSocial.platform !== s)
          )
          .map((s) =>
            new MessageButton()
              .setLabel(`Connect ${capitalizeFirst(s)}`)
              .setStyle("SECONDARY")
              .setEmoji(getEmoji(s.toUpperCase() as EmojiKey))
              .setCustomId(`profile_connect-${s}`)
          )
      ),
    ],
  }
}

async function renderSocials(socials: any[]) {
  return (
    await Promise.all(
      socials.map((s) => {
        if (s.platform === "twitter") {
          return `${getEmoji("TWITTER")} **[${
            s.platform_identifier
          }](${TWITTER_USER_URL}/${s.platform_identifier})**`
        } else if (s.platform === "telegram") {
          return `${getEmoji("TELEGRAM")} **[@${
            s.platform_identifier
          }](${TELEGRAM_USER_URL}/${s.platform_identifier})**`
        }
      })
    )
  ).join("\n")
}

export async function renderWallets({
  mochiWallets,
  wallets,
}: {
  mochiWallets: {
    data: any[]
    title?: string
  }
  wallets: {
    data: any[]
    title?: string
  }
}) {
  const strings = (
    await Promise.all([
      await renderListWallet(
        getEmoji("NFT2"),
        mochiWallets.title ?? "`Mochi`",
        mochiWallets.data,
        0,
        false
      ),
      await renderListWallet(
        getEmoji("WALLET_1"),
        wallets.title ?? "`On-chain`",
        wallets.data,
        mochiWallets.data.length,
        true
      ),
    ])
  ).filter(Boolean)

  return strings.join("\n\n")
}

function sendKafka(profileId: string, username: string) {
  const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
    profileId,
    MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
    MOCHI_APP_SERVICE,
    MOCHI_ACTION_PROFILE
  )
  kafkaMsg.activity.content.username = username
  sendActivityMsg(kafkaMsg)
}

export async function render(msg: OriginalMessage, member: GuildMember) {
  if (!(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Couldn't get user data",
    })
  }
  const dataProfile = await profile.getByDiscord(member.user.id)
  if (dataProfile.err) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Couldn't get profile data",
    })
  }
  sendKafka(dataProfile.id, member.user.username)

  return await compose(msg, member, dataProfile)
}
