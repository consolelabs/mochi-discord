import profile from "adapters/profile"
import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageSelectMenu,
  User,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  authorFilter,
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
import { wrapError } from "utils/wrap-error"
import {
  BalanceType,
  formatView,
  getBalances,
  renderBalances,
} from "commands/balances/index/processor"
import { formatDigit } from "utils/defi"
import { runGetVaultDetail } from "commands/vault/info/processor"

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

  return `${emoji}${title}\n${formatDataTable(
    [
      wallets.map((w) => (w.chain || isAddress(w.value).type).toUpperCase()),
      wallets.map((w, i) => domains[i] || shortenHashOrAddress(w.value)),
      wallets.map((w) => (w.total?.toString() ? `$${w.total.toString()}` : "")),
    ],
    {
      rowAfterFormatter: (formatted, i) =>
        `${getEmoji(`NUM_${i + 1 + offset}` as EmojiKey)}${formatted}${
          showCash ? getEmoji("CASH") : ""
        }`,
    }
  )}`
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" })
const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
])

function renderVaults(
  vaults: { name: string; total?: number; threshold: number }[]
) {
  return formatDataTable(
    [
      vaults.map(
        (v) => `${v.name.slice(0, 24)}${v.name.length > 24 ? "..." : ""}`
      ),
      vaults.map((v) => v.threshold.toString()),
      vaults.map((v) => (v.total?.toString() ? `$${v.total.toString()}` : "")),
    ],
    {
      rowAfterFormatter: (formatted) =>
        `${getEmoji("ANIMATED_VAULT", true)}${formatted}${getEmoji("CASH")}`,
    }
  )
}

async function compose(
  msg: OriginalMessage,
  member: GuildMember,
  dataProfile: any
) {
  const [podProfileRes, vaultsRes, walletsRes, socials, balances] =
    await Promise.all([
      profile.getUserProfile(msg.guildId ?? "", member.user.id),
      profile.getUserVaults(dataProfile.id, msg.guildId),
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

  let vaults = []
  if (vaultsRes.ok) {
    vaults = vaultsRes.data as any[]
  }
  vaults = vaults.slice(0, 5)
  vaults = vaults.map((v) => {
    const allTotals = Object.keys(v).filter((k) => k.startsWith("total_amount"))

    return {
      ...v,
      total: formatDigit({
        value: String(allTotals.reduce((acc, c) => (acc += Number(v[c])), 0)),
        fractionDigits: 2,
      }),
    }
  })

  const { onchainTotal, mochiWallets, wallets: _wallets, pnl } = walletsRes
  const wallets = _wallets.slice(0, 10)
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp
  const highestRole =
    member.roles.highest.name !== "@everyone" ? member.roles.highest : "N/A"

  const { totalWorth } = formatView("compact", balances.data)
  const grandTotal = formatDigit({
    value: String(totalWorth + onchainTotal),
    fractionDigits: 2,
  })
  const mochiBal = formatDigit({
    value: totalWorth.toString(),
    fractionDigits: 2,
  })

  const embed = composeEmbedMessage(null, {
    author: [
      member.nickname || member.displayName,
      member.user.displayAvatarURL(),
    ],
    color: msgColors.BLUE,
    description: `${getEmoji("LEAF")}\`Role. \`${highestRole}\n${getEmoji(
      "CASH"
    )}\`Total Balance. $${grandTotal}\`(${getEmoji(
      pnl.split("")[0] === "-" ? "ANIMATED_ARROW_DOWN" : "ANIMATED_ARROW_UP",
      true
    )} ${formatDigit({
      value: pnl.slice(1),
      fractionDigits: 2,
    })}%)\n${getEmoji("ANIMATED_BADGE_1", true)}\`Lvl. ${
      userProfile.current_level?.level ?? "N/A"
    } (${userProfile.guild_rank ?? 0}${suffixes.get(
      pr.select(userProfile.guild_rank ?? 0)
    )})\`\n${getEmoji("ANIMATED_XP", true)}\`Exp. ${
      userProfile.guild_xp
    }/${nextLevelMinXp}\``,
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
            value: renderVaults(vaults),
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
  ])
  return {
    embeds: [embed],
    components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setPlaceholder(`💰 View wallet/vault`)
          .setCustomId("view_wallet/vault")
          .addOptions(
            [
              {
                value: "mochi_Mochi Wallet",
                type: "wallet",
                usd: mochiBal,
                chain: "",
              },
              ...wallets.map((w) => ({
                ...w,
                type: "wallet",
                value: `onchain_${w.value}`,
                usd: w.total,
              })),
              ...vaults.map((v) => ({
                ...v,
                type: "vault",
                value: `vault_${v.name}`,
                usd: v.total,
              })),
            ].map((w, i) => {
              const isMochi = w.value.split("_")[0] === "mochi"
              const address = w.value.split("_")[1]
              let label = ""
              if (w.type === "wallet") {
                label = `${isMochi ? "🔸  " : "🔹  "}${w.chain} | ${
                  isMochi ? address : shortenHashOrAddress(address)
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
          .setCustomId("profile_qrcodes"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Quest")
          .setEmoji("<a:brrr:902558248907980871>")
          .setCustomId("profile_quest"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Watchlist")
          .setEmoji(getEmoji("ANIMATED_STAR", true))
          .setCustomId("profile_watchlist"),
        new MessageButton()
          .setLabel(`${wallets.length ? "Add" : "Connect"} Wallet`)
          .setEmoji(getEmoji("WALLET_1"))
          .setStyle("SECONDARY")
          .setCustomId("profiel_connect-wallet")
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

function collectSelection(
  reply: Message,
  author: User,
  targetId: string,
  originalMsg: OriginalMessage,
  components: any
) {
  reply
    .createMessageComponentCollector({
      componentType: "SELECT_MENU",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }
        const selectedWallet = i.values[0]
        const [prefix, addressOrVaultName] = selectedWallet.split("_")
        const isMochi = prefix === "mochi"
        const isVault = prefix === "vault"
        let messageOptions
        if (isVault) {
          const vaultName = addressOrVaultName
          ;({ messageOptions } = await runGetVaultDetail(
            vaultName,
            originalMsg
          ))
        } else {
          const address = addressOrVaultName
          ;({ messageOptions } = await renderBalances(
            targetId,
            originalMsg,
            isMochi ? BalanceType.Offchain : BalanceType.Onchain,
            address
          ))
        }

        messageOptions.components.unshift(
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Back")
              .setStyle("SECONDARY")
              .setCustomId("back")
          )
        )
        const edited = (await i.editReply(messageOptions)) as Message

        edited
          .createMessageComponentCollector({
            filter: authorFilter(author.id),
            componentType: "BUTTON",
            time: 300000,
          })
          .on("collect", (i) => {
            wrapError(edited, async () => {
              if (!i.deferred) {
                await i.deferUpdate().catch(() => null)
              }
              if (i.customId === "back") {
                i.editReply({ embeds: reply.embeds, components })
              }
            })
          })
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
}

function collectButton(reply: Message, author: User) {
  reply
    .createMessageComponentCollector({
      componentType: "BUTTON",
      filter: authorFilter(author.id),
      time: 300000,
    })
    .on("collect", (i) => {
      wrapError(reply, async () => {
        if (!i.deferred) {
          await i.deferUpdate().catch(() => null)
        }
        if (i.customId !== "back" && i.customId.startsWith("profile")) {
          i.followUp({ content: "WIP!", ephemeral: true })
        }
      })
    })
    .on("end", () => {
      wrapError(reply, async () => {
        await reply.edit({ components: [] }).catch(() => null)
      })
    })
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

export async function render(
  msg: OriginalMessage,
  _member?: GuildMember | null
) {
  const member = _member ?? msg.member
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

  const replyPayload = await compose(msg, member, dataProfile)

  let reply
  let author
  if (
    msg instanceof CommandInteraction ||
    msg instanceof MessageComponentInteraction
  ) {
    author = msg.user
    reply = await msg.editReply(replyPayload).catch(() => {
      replyPayload.embeds[0].fields.pop()
      return msg.editReply(replyPayload)
    })
  } else {
    author = msg.member?.user
    reply = await msg.reply({ ...replyPayload }).catch(() => {
      replyPayload.embeds[0].fields.pop()
      return msg.reply({ ...replyPayload })
    })
  }

  collectSelection(
    reply as Message,
    author as User,
    member.user.id,
    msg,
    replyPayload.components
  )

  collectButton(reply as Message, author as User)
}
