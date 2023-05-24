import profile from "adapters/profile"
import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  User,
} from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  authorFilter,
  EmojiKey,
  getEmoji,
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
import { viewWalletDetails } from "commands/wallet/view/processor"
import {
  balanceTypes,
  formatView,
  getBalances,
  renderBalances,
} from "commands/balances/index/processor"
import { formatDigit } from "utils/defi"

async function renderListWallet(
  emoji: string,
  title: string,
  wallets: { value: string; chain?: string; total_amount?: number }[],
  offset: number
) {
  if (!wallets.length) return ""
  let longestAddr = 0
  let longestDomain = 0
  let longestChain = 0
  let longestBal = 0
  const domains = await Promise.all(
    wallets.map(async (w) => await reverseLookup(w.value))
  )
  for (const [i, w] of wallets.entries()) {
    const chainName = (w.chain || isAddress(w.value).type).toUpperCase()
    const bal = w.total_amount?.toString() ?? ""
    longestAddr = Math.max(shortenHashOrAddress(w.value).length, longestAddr)
    longestDomain = Math.max(domains[i].length, longestDomain)
    longestChain = Math.max(chainName.length, longestChain)
    longestBal = Math.max(bal.length, longestBal)
  }
  const arr = wallets.map((w, i) => {
    const chainName = (w.chain || isAddress(w.value).type).toUpperCase()
    const shortenAddr = domains[i] || shortenHashOrAddress(w.value)
    const bal = w.total_amount?.toString() ?? ""
    const formattedString = `${getEmoji(
      `NUM_${i + 1 + offset}` as EmojiKey
    )}\`${chainName}${" ".repeat(
      longestChain - chainName.length
    )} | ${shortenAddr}${" ".repeat(
      Math.max(longestAddr, longestDomain) - shortenAddr.length
    )}${
      bal
        ? ` | ${" ".repeat(longestBal - bal.length)}$${bal}\`${getEmoji(
            "CASH"
          )}`
        : "`"
    }`
    return formattedString
  })

  if (!arr) return ""

  return `${emoji}${title}\n${arr.join("\n")}`
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" })
const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
])

function renderVaults(vaults: any[]) {
  let longestName = 0
  let longestBal = 0
  for (const v of vaults) {
    const name = `${v.name.slice(0, 24)}${v.name.length > 24 ? "..." : ""}`
    const bal = v.total_amount?.toString() ?? "0"
    longestName = Math.max(longestName, name.length)
    longestBal = Math.max(longestBal, bal.length)
  }

  const formatFunc = (v: any) => {
    const name = `${v.name.slice(0, 24)}${v.name.length > 24 ? "..." : ""}`
    const bal = v.total_amount?.toString() ?? "0"
    return `${getEmoji("ANIMATED_VAULT", true)}\`${name}${" ".repeat(
      longestName - name.length
    )} | ${" ".repeat(3 - v.threshold.toString().length)}${
      v.threshold
    }% | ${" ".repeat(longestBal - bal.length)}$${bal}\`${getEmoji("CASH")}`
  }

  return vaults.map(formatFunc).join("\n")
}

async function compose(
  msg: OriginalMessage,
  member: GuildMember,
  profileId: string
) {
  const {
    data: userProfile,
    ok,
    curl,
    log,
  } = await profile.getUserProfile(msg.guildId ?? "", member.user.id)
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, description: log, curl })
  }

  let vaults = []
  const { data: vaultsRes, ok: vaultOk } = await profile.getUserVaults(
    profileId,
    msg.guildId
  )
  if (vaultOk) {
    vaults = vaultsRes as any[]
  }
  vaults = vaults.slice(0, 5)

  const { mochiWallets, wallets: _wallets } = await profile.getUserWallets(
    member.id
  )
  const socials = await profile.getUserSocials(member.id)
  const wallets = _wallets.slice(0, 10)
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp
  const highestRole =
    member.roles.highest.name !== "@everyone" ? member.roles.highest : null

  const balances = await getBalances(profileId, balanceTypes.Offchain, msg)
  const { totalWorth } = formatView("compact", balances)
  const embed = composeEmbedMessage(null, {
    thumbnail: member.user.displayAvatarURL(),
    author: ["vincent", member.user.displayAvatarURL()],
    color: msgColors.BLUE,
    description: `${getEmoji("LEAF")}\`Role. \`${highestRole}\n${getEmoji(
      "CASH"
    )}\`Total Balance. $${(Math.random() * 10000).toFixed(2)}\`(${getEmoji(
      Math.random() > 0.5 ? "ANIMATED_ARROW_UP" : "ANIMATED_ARROW_DOWN",
      true
    )} ${(Math.random() * 10).toFixed(1)}%)\n${getEmoji(
      "ANIMATED_BADGE_1",
      true
    )}\`Lvl. ${userProfile.current_level?.level ?? "N/A"} (${
      userProfile.guild_rank ?? 0
    }${suffixes.get(pr.select(userProfile.guild_rank ?? 0))})\`\n${getEmoji(
      "ANIMATED_XP",
      true
    )}\`Exp. ${userProfile.guild_xp}/${nextLevelMinXp}\``,
  }).addFields([
    {
      name: "Wallets",
      value: await renderWallets({
        mochiWallets: {
          data: mochiWallets,
          title: `\`Mochi ($${formatDigit({
            value: totalWorth.toString(),
            fractionDigits: 2,
          })})\`${getEmoji("CASH")}`,
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
          .setPlaceholder("View wallet/vault")
          .setCustomId("view_wallet/vault")
          .addOptions(
            [
              ...mochiWallets.map((w) => ({
                ...w,
                value: `mochi_${w.value}`,
                type: "wallet",
                usd: 0,
              })),
              ...wallets.map((w) => ({
                ...w,
                type: "wallet",
                value: `onchain_${w.value}`,
                usd: 0,
              })),
              ...vaults.map((v) => ({
                ...v,
                type: "vault",
                value: v.name,
                usd: 0,
              })),
            ].map((w, i) => {
              const isMochi = w.value.split("_")[0] === "mochi"
              let label = ""
              if (w.type === "wallet") {
                label = `${isMochi ? "🔸  " : "🔹  "}${
                  w.chain
                } | ${shortenHashOrAddress(w.value.split("_")[1])} | 💵 $${
                  w.usd
                }`
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
          return `${getEmoji("TELEGRAM")} **[Telegram](${TELEGRAM_USER_URL}/${
            s.platform_identifier
          })**`
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
        0
      ),
      await renderListWallet(
        getEmoji("WALLET_1"),
        wallets.title ?? "`On-chain`",
        wallets.data,
        mochiWallets.data.length
      ),
    ])
  ).filter(Boolean)

  return strings.join("\n\n")
}

function collectSelection(
  reply: Message,
  author: User,
  user: User,
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
        const [isMochi, address] = selectedWallet.split("_")
        let messageOptions
        if (isMochi === "mochi" && address) {
          ;({ messageOptions } = await renderBalances(
            author.id,
            reply,
            balanceTypes.Offchain
          ))
        } else {
          ;({ messageOptions } = await viewWalletDetails(reply, user, address))
        }

        messageOptions.components = [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Back")
              .setStyle("SECONDARY")
              .setCustomId("back")
          ),
        ]
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
              i.editReply({ embeds: reply.embeds, components })
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

  const replyPayload = await compose(msg, member, dataProfile.id)

  let reply
  let author
  if (msg instanceof CommandInteraction) {
    author = msg.user
    reply = await msg.editReply(replyPayload).catch(() => {
      replyPayload.embeds[0].fields.pop()
      return msg.editReply(replyPayload)
    })
  } else {
    author = msg.member?.user
    reply = await msg.reply({ ...replyPayload, fetchReply: true }).catch(() => {
      replyPayload.embeds[0].fields.pop()
      return msg.reply({ ...replyPayload, fetchReply: true })
    })
  }

  collectSelection(
    reply as Message,
    author as User,
    member.user,
    replyPayload.components
  )
}
