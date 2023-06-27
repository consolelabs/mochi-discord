import profile from "adapters/profile"
import {
  ButtonInteraction,
  GuildMember,
  MessageActionRow,
  MessageButton,
  Modal,
  MessageSelectMenu,
  TextInputComponent,
  ModalActionRowComponent,
  CommandInteraction,
  SelectMenuInteraction,
} from "discord.js"
import { APIError, InternalError } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  capitalizeFirst,
  EmojiKey,
  getEmoji,
  isAddress,
  msgColors,
  reverseLookup,
  shortenHashOrAddress,
  getEmojiURL,
  emojis,
  thumbnails,
  equalIgnoreCase,
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
import { getSlashCommand } from "utils/commands"

async function renderListWallet(
  emoji: string,
  title: string,
  wallets: { value: string; chain?: string; total?: number }[],
  offset: number,
  showCash: boolean,
  truncateAddress = true
) {
  if (!wallets.length) return ""
  const domains = await Promise.all(
    wallets.map(async (w) => {
      if (!w.value) return ""
      return await reverseLookup(w.value)
    })
  )

  const data = wallets.map((w, i) => {
    let address = domains[i]

    if (!domains[i]) {
      if (truncateAddress) {
        address = shortenHashOrAddress(w.value)
      } else {
        address = w.value
      }
    }

    return {
      chain: w.chain || isAddress(w.value).chainType,
      address,
      balance: w.total?.toString() ? `$${w.total.toString()}` : "",
    }
  })

  return `${emoji}${title}\n${
    formatDataTable(data, {
      cols: ["chain", "address", "balance"],
      rowAfterFormatter: (formatted, i) =>
        `${getEmoji(`NUM_${i + 1 + offset}` as EmojiKey)}${formatted}${
          showCash && data[i].balance ? getEmoji("CASH") : ""
        } `,
    }).joined
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
  i: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  member: GuildMember,
  dataProfile: any
) {
  const [podProfileRes, vaultsRes, walletsRes, socials, balances] =
    await Promise.all([
      profile.getUserProfile(i.guildId ?? "", member.user.id),
      config.vaultList(i.guildId ?? "", false, dataProfile.id),
      profile.getUserWallets(member.id),
      profile.getUserSocials(member.id),
      getBalances(
        dataProfile.id,
        member.user.id,
        BalanceType.Offchain,
        i,
        "",
        ""
      ),
    ])
  if (!podProfileRes.ok) {
    throw new APIError({
      msgOrInteraction: i,
      description: podProfileRes.log,
      curl: podProfileRes.curl,
    })
  }
  const userProfile = podProfileRes.data

  const vaults = vaultsRes.slice(0, 5)

  const {
    onchainTotal,
    cexTotal,
    mochiWallets,
    cexes,
    wallets: _wallets,
    pnl,
  } = walletsRes
  const wallets = _wallets.slice(0, 10)
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp
  const highestRole =
    member.roles.highest.name !== "@everyone" ? member.roles.highest : "N/A"

  const { totalWorth } = formatView("compact", "filter-dust", balances.data)
  const grandTotal = totalWorth + onchainTotal + cexTotal
  const grandTotalStr = formatDigit({
    value: String(grandTotal),
    fractionDigits: grandTotal >= 100 ? 0 : 2,
  })
  const mochiBal = formatDigit({
    value: totalWorth.toString(),
    fractionDigits: totalWorth >= 100 ? 0 : 2,
  })

  const { data: inbox } = await profile.getUserActivities(dataProfile.id)
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
    )}\`Balance. $${grandTotalStr}\`${
      pnl === 0
        ? ""
        : `(${getEmoji(
            Math.sign(pnl) === -1 ? "ANIMATED_ARROW_DOWN" : "ANIMATED_ARROW_UP",
            true
          )} ${formatDigit({
            value: Math.abs(pnl),
            fractionDigits: 2,
          })}%)`
    }\n${getEmoji("ANIMATED_BADGE_1", true)}\`Lvl. ${
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
        cexes: {
          data: cexes,
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

  const notLinkedPlatforms = ["twitter", "telegram", "binance"]
    .filter((s) =>
      socials.every(
        (connectedSocial: any) => !equalIgnoreCase(connectedSocial.platform, s)
      )
    )
    .filter((s) =>
      cexes.every((connectedCex) => !equalIgnoreCase(connectedCex.chain, s))
    )

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
              ...cexes.map((d) => ({
                ...d,
                value: `wallet_cex_${d.value}`,
                type: "wallet",
                usd: d.total,
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
                label = `${
                  isMochi ? "🔸  " : "🔹  "
                }${w.chain.toUpperCase()} | ${
                  isMochi ? address : shortenHashOrAddress(address, 3, 4)
                } | 💵 $${w.usd}`
              }
              if (w.type === "vault") {
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
          .setLabel("Watchlist")
          .setEmoji(getEmoji("ANIMATED_STAR", true))
          .setCustomId("view_watchlist"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("Quest")
          .setEmoji("<a:brrr:902558248907980871>")
          .setCustomId("view_quests"),
        new MessageButton()
          .setStyle("SECONDARY")
          .setLabel("QR")
          .setEmoji(getEmoji("QRCODE"))
          .setCustomId("view_qr_codes"),
        new MessageButton()
          .setLabel(`Wallet`)
          .setEmoji(getEmoji("PLUS"))
          .setStyle("SECONDARY")
          .setCustomId("view_add_wallet")
      ),
      ...(notLinkedPlatforms.length
        ? [
            new MessageActionRow().addComponents(
              ...notLinkedPlatforms.map((s) =>
                new MessageButton()
                  .setLabel(`Connect ${capitalizeFirst(s)}`)
                  .setStyle("SECONDARY")
                  .setEmoji(getEmoji(s.toUpperCase() as EmojiKey))
                  .setCustomId(`connect_${s}`)
              )
            ),
          ]
        : []),
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
        // else if (s.platform == "binance") {
        //   return `${getEmoji("BNB")} **${
        //     s.platform_metadata?.username ?? "Binance Connected"
        //   }**`
        // }
      })
    )
  ).join("\n")
}

export async function renderWallets({
  mochiWallets,
  wallets,
  cexes,
}: {
  mochiWallets: {
    data: any[]
    title?: string
    truncate?: boolean
  }
  wallets: {
    data: any[]
    title?: string
    truncate?: boolean
  }
  cexes: {
    data: any[]
    title?: string
    truncate?: boolean
  }
}) {
  const strings = (
    await Promise.all([
      await renderListWallet(
        getEmoji("NFT2"),
        mochiWallets.title ?? "`Mochi`",
        mochiWallets.data,
        0,
        false,
        mochiWallets.truncate
      ),
      await renderListWallet(
        getEmoji("WALLET_1"),
        wallets.title ?? "`On-chain`",
        wallets.data,
        mochiWallets.data.length,
        true,
        wallets.truncate
      ),
      await renderListWallet(
        getEmoji("WEB"),
        cexes.title ?? "`CEX`",
        cexes.data,
        mochiWallets.data.length + (wallets.data.length || 0),
        true,
        cexes.truncate
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

export async function render(
  i: CommandInteraction | ButtonInteraction | SelectMenuInteraction,
  member: GuildMember
) {
  if (!(member instanceof GuildMember)) {
    throw new InternalError({
      msgOrInteraction: i,
      description: "Couldn't get user data",
    })
  }
  const dataProfile = await profile.getByDiscord(member.user.id, false)
  if (dataProfile.err) {
    throw new InternalError({
      msgOrInteraction: i,
      description: "Couldn't get profile data",
    })
  }
  sendKafka(dataProfile.id, member.user.username)

  return await compose(i, member, dataProfile)
}

export function sendBinanceManualMessage(isUpdating = false) {
  const embed = composeEmbedMessage(null, {
    author: [
      `${isUpdating ? "Update" : "Connect"} Binance`,
      getEmojiURL(emojis.BINANCE),
    ],
    description: `To ${
      isUpdating ? "update" : "link"
    } your Binance account, please follow steps below:\n\n${getEmoji(
      "NUM_1"
    )} Create a new API key with **Read-Only permissions** in the [API Management page](https://www.binance.com/en/my/settings/api-management), \n${getEmoji(
      "NUM_2"
    )} Back to Discord and hit **"Connect"**`,
    image: `https://media.discordapp.net/attachments/1052079279619457095/1116282037389754428/Screenshot_2023-06-08_at_15.25.40.png?width=2332&height=1390`,
  })

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel(isUpdating ? "Update" : "Connect")
      .setStyle("SECONDARY")
      .setEmoji(getEmoji("BINANCE"))
      .setCustomId("enter_key")
  )

  return {
    msgOpts: {
      embeds: [embed],
      components: [row],
    },
  }
}

export async function showModalBinanceKeys(
  interaction: ButtonInteraction,
  isUpdating = false
) {
  const modal = new Modal()
    .setCustomId("binance-key-form")
    .setTitle(`${isUpdating ? "Update" : "Connect"} Binance`)

  const apiKeyInput = new TextInputComponent()
    .setCustomId("key")
    .setLabel("API Key")
    .setRequired(true)
    .setStyle("SHORT")

  const apiSecretInput = new TextInputComponent()
    .setCustomId("secret")
    .setLabel("Secret Key")
    .setRequired(true)
    .setStyle("SHORT")

  const apiKeyAction =
    new MessageActionRow<ModalActionRowComponent>().addComponents(apiKeyInput)
  const apiSecretAction =
    new MessageActionRow<ModalActionRowComponent>().addComponents(
      apiSecretInput
    )

  modal.addComponents(apiKeyAction, apiSecretAction)

  await interaction.showModal(modal)

  const submitted = await interaction
    .awaitModalSubmit({
      time: 1000 * 60 * 5,
    })
    .catch(() => null)

  if (!submitted) return { key: "", secret: "" }

  if (!submitted.deferred) {
    await submitted.deferUpdate().catch(() => null)
  }

  const key = submitted.fields.getTextInputValue("key")
  const secret = submitted.fields.getTextInputValue("secret")

  return { key, secret }
}

export async function submitBinanceKeys(
  i: ButtonInteraction,
  payload: {
    key: string
    secret: string
  }
) {
  if (!payload.key || !payload.secret) {
    return sendBinanceManualMessage()
  }

  // call api
  const res = await profile.submitBinanceKeys({
    discordUserId: i.user.id,
    apiSecret: payload.secret,
    apiKey: payload.key,
  })

  const embed = composeEmbedMessage(null, {})

  if (res.status === 200) {
    // case success
    embed
      .setTitle(`${getEmoji("BINANCE")} Key validated`)
      .setDescription(
        [
          `${getEmoji("CHECK")} Use ${await getSlashCommand(
            "profile"
          )} to track your Binance portfolio.`,
          `${getEmoji("CHECK")} We will notify when the data is ready.`,
        ].join("\n")
      )
      .setImage(thumbnails.MOCHI_POSE_12)

    return {
      msgOpts: {
        embeds: [embed],
        components: [],
      },
    }
  } else {
    embed
      .setTitle(`${getEmoji("BINANCE")} Invalid Binance Key`)
      .setDescription(
        `We can't use your Binance Key, there might be a problem with\n\n\t${getEmoji(
          "NUM_1"
        )} You input the wrong Key, check again at your [API Management page](https://www.binance.com/en/my/settings/api-management)\n\t${getEmoji(
          "NUM_2"
        )} Make sure your Key has **READ-ONLY** permission`
      )
      .setColor(msgColors.ERROR)

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel("Retry")
        .setStyle("PRIMARY")
        .setEmoji(getEmoji("BINANCE"))
        .setCustomId("enter_key")
    )

    return {
      msgOpts: {
        embeds: [embed],
        components: [row],
      },
    }
  }
}
