import profile from "adapters/profile"
import {
  ButtonInteraction,
  ColorResolvable,
  GuildMember,
  MessageActionRow,
  MessageButton,
  Modal,
  MessageEmbed,
  MessageSelectMenu,
  TextInputComponent,
  ModalActionRowComponent,
  ModalSubmitInteraction,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import {
  composeEmbedMessage,
  formatDataTable,
  getEmbedFooter,
} from "ui/discord/embed"
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
} from "utils/common"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_PROFILE,
  MOCHI_APP_SERVICE,
  TWITTER_USER_URL,
  TELEGRAM_USER_URL,
} from "utils/constants"
import { KafkaQueueActivityDataCommand, embedsColors } from "types/common"
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
    wallets.map(async (w) => {
      if (!w.value) return ""
      return await reverseLookup(w.value)
    })
  )

  return `${emoji}${title}\n${
    formatDataTable(
      wallets.map((w, i) => {
        let address = domains[i] || shortenHashOrAddress(w.value, 5, 5)
        if (!domains[i] && showCash) address = shortenHashOrAddress(w.value)

        return {
          chain: (w.chain || isAddress(w.value).chainType).toUpperCase(),
          address,
          balance: w.total?.toString() ? `$${w.total.toString()}` : "",
        }
      }),
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

  const {
    onchainTotal,
    dexTotal,
    mochiWallets,
    dexs,
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
  const grandTotal = formatDigit({
    value: String(totalWorth + onchainTotal + dexTotal),
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
        dexs: {
          data: dexs,
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

  const notLinkedPlatforms = ["twitter", "telegram", "binance"].filter((s) =>
    socials.every((connectedSocial) => connectedSocial.platform !== s)
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
              ...dexs.map((d) => ({
                ...d,
                value: `wallet_dex_${d.value}`,
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
          .setLabel("QR")
          .setEmoji(getEmoji("QRCODE"))
          .setCustomId("view_qr_codes"),
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
                  .setCustomId(`profile_connect-${s}`)
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
        } else if (s.platform == "binance") {
          return `${getEmoji("BNB")} **${
            s.platform_metadata?.username ?? "Binance Connected"
          }**`
        }
      })
    )
  ).join("\n")
}

export async function renderWallets({
  mochiWallets,
  wallets,
  dexs,
}: {
  mochiWallets: {
    data: any[]
    title?: string
  }
  wallets: {
    data: any[]
    title?: string
  }
  dexs: {
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
      await renderListWallet(
        getEmoji("WEB"),
        dexs.title ?? "`DEXs`",
        dexs.data,
        mochiWallets.data.length + (wallets.data.length || 0),
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
  const dataProfile = await profile.getByDiscord(member.user.id, false)
  if (dataProfile.err) {
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Couldn't get profile data",
    })
  }
  sendKafka(dataProfile.id, member.user.username)

  return await compose(msg, member, dataProfile)
}

export async function sendBinanceManualMessage(interaction: ButtonInteraction) {
  if (!interaction.member || !interaction.guildId) return

  await interaction.deferReply({ ephemeral: true })
  const embed = new MessageEmbed()
    .setColor(embedsColors.Profile as ColorResolvable)
    .setTitle(`${getEmoji("BNB")} Connect Binance`)
    .setFooter({
      text: getEmbedFooter([interaction.user.tag]),
      iconURL: interaction.user.avatarURL() || getEmojiURL(emojis.MOCHI_CIRCLE),
    })
    .setTimestamp(new Date())
    .setDescription(
      `In order to connect with your Binance data, please follow steps below:\n\n\t${getEmoji(
        "NUM_1"
      )} Login to your [Binance account](https://binance.com/)\n\t${getEmoji(
        "NUM_2"
      )} Go to [API Management page](https://www.binance.com/en/my/settings/api-management), and create a new API key with **Read-Only permissions**\n\t${getEmoji(
        "NUM_3"
      )} Hit the "Connect" button below and paste your API key and secret
    `
    )
    .setImage(
      `https://media.discordapp.net/attachments/1052079279619457095/1116282037389754428/Screenshot_2023-06-08_at_15.25.40.png?width=2332&height=1390`
    )

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Connect")
      .setStyle("PRIMARY")
      .setEmoji(getEmoji("BNB"))
      .setCustomId("profile-connect_binance_show_modal")
  )

  await interaction
    .editReply({ embeds: [embed], components: [row] })
    .catch(() => null)
}

export async function showModalBinanceKeys(interaction: ButtonInteraction) {
  const modal = new Modal()
    .setCustomId("profile-connect_binance_submit")
    .setTitle("Connect Binance")

  const apiKeyInput = new TextInputComponent()
    .setCustomId("profile-connect-input_binance_api_key")
    .setLabel("API Key")
    .setRequired(true)
    .setStyle("SHORT")

  const apiSecretInput = new TextInputComponent()
    .setCustomId("profile-connect-input_binance_api_secret")
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

  const submitted = await interaction.awaitModalSubmit({
    time: 1000 * 60 * 5,
  })

  if (!submitted.deferred) {
    await submitted.deferUpdate().catch(() => null)
  }
}

export async function submitBinanceKeys(interaction: ModalSubmitInteraction) {
  if (!interaction.isModalSubmit()) return
  await interaction.deferReply({ ephemeral: true })

  const apiKey = interaction.fields.getTextInputValue(
    "profile-connect-input_binance_api_key"
  )
  const apiSecret = interaction.fields.getTextInputValue(
    "profile-connect-input_binance_api_secret"
  )

  // call api
  const res = await profile.submitBinanceKeys({
    discordUserId: interaction.user.id,
    apiSecret: apiSecret,
    apiKey: apiKey,
  })

  if (res.status !== 200) {
    const embed = new MessageEmbed()
      .setTitle(`${getEmoji("BNB")} Invalid Binance Key`)
      .setDescription(
        `We can't use your Binance Key, there might be a problem with\n\n\t${getEmoji(
          "NUM_1"
        )} You input the wrong Key, check again at your [API Management page](https://www.binance.com/en/my/settings/api-management)\n\t${getEmoji(
          "NUM_2"
        )} Make sure your Key has **READ-ONLY** permission`
      )
      .setFooter({
        text: getEmbedFooter([interaction.user.tag]),
        iconURL:
          interaction.user.avatarURL() || getEmojiURL(emojis.MOCHI_CIRCLE),
      })
      .setColor(msgColors.ERROR)
      .setTimestamp(new Date())

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel("Retry")
        .setStyle("PRIMARY")
        .setEmoji(getEmoji("BNB"))
        .setCustomId("profile-connect_binance_show_modal")
    )
    await interaction
      .editReply({ embeds: [embed], components: [row] })
      .catch(() => null)
    return
  }

  if (res.status === 200) {
    // case success
    const embed = new MessageEmbed()
      .setTitle(`${getEmoji("BNB")} We got your Key!`)
      .setDescription(
        `<:_:850050324135673937> use ${await getSlashCommand(
          "profile"
        )} to track your Binance portfolio\n\n We will also notify you when your full historical data is ready!`
      )
      .setFooter({
        text: getEmbedFooter([interaction.user.tag]),
        iconURL:
          interaction.user.avatarURL() || getEmojiURL(emojis.MOCHI_CIRCLE),
      })
      .setColor(msgColors.SUCCESS)
      .setTimestamp(new Date())

    // clear cache to get new data
    CacheManager.findAndRemove("profile-data", interaction.user.id)

    await interaction.editReply({ embeds: [embed] }).catch(() => null)
    return
  }

  throw new APIError({
    curl: res.curl,
    description: res.log,
  })
}
