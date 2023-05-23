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
import { balanceTypes, renderBalances } from "commands/balances/index/processor"

async function renderListWallet(
  emoji: string,
  title: string,
  wallets: { value: string; chain?: string }[],
  offset: number
) {
  let longestAddr = 0
  let longestDomain = 0
  let longestChain = 0
  const domains = await Promise.all(
    wallets.map(async (w) => await reverseLookup(w.value))
  )
  for (const [i, w] of wallets.entries()) {
    longestAddr = Math.max(shortenHashOrAddress(w.value).length, longestAddr)
    longestDomain = Math.max(domains[i].length, longestDomain)
    const chainName = (w.chain || isAddress(w.value).type).toUpperCase()
    longestChain = Math.max(chainName.length, longestChain)
  }
  const arr = wallets.map((w, i) => {
    const isAllDomainsEmpty = domains.every((d) => d.trim() === "")
    const chainName = (w.chain || isAddress(w.value).type).toUpperCase()
    const shortenAddr = shortenHashOrAddress(w.value)
    const formattedString = `${getEmoji(
      `NUM_${i + 1 + offset}` as EmojiKey
    )}\`${chainName}${" ".repeat(
      longestChain - chainName.length
    )} | ${shortenAddr}${" ".repeat(longestAddr - shortenAddr.length)} ${
      isAllDomainsEmpty ? " " : domains[i] ? "| " + domains[i] : "  "
    }${" ".repeat(longestDomain - domains[i].length)}\``
    return formattedString
  })

  if (!arr) return ""

  return `${emoji}\`${title}\`\n${arr.join("\n")}`
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" })
const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
])

function renderVaults(vaults: any[], discordId: string) {
  let longestOwner = 0
  let longestMember = 0
  for (const v of vaults) {
    if (
      v.treasurers.find(
        (t: any) => t.role === "creator" && t.user_discord_id === discordId
      )
    ) {
      longestOwner = Math.max(longestOwner, v.name.length)
    } else {
      longestMember = Math.max(longestMember, v.name.length)
    }
  }

  const onlyOwner = vaults.filter((v) =>
    v.treasurers.some(
      (t: any) => t.role === "creator" && t.user_discord_id === discordId
    )
  )

  const onlyMember = vaults.filter((v) => onlyOwner.every((o) => o.id !== v.id))

  const formatFunc = (length: number) => (v: any) =>
    `${getEmoji("ANIMATED_VAULT", true)}\`${v.name}${" ".repeat(
      length - v.name.length
    )} | ${" ".repeat(3 - v.threshold.toString().length)}${v.threshold}%\``

  const ownerText = onlyOwner.length
    ? `${getEmoji("BLANK")}\`Owner of\`\n${onlyOwner
        .map(formatFunc(longestOwner))
        .join("\n")}`
    : ""

  const memberText = onlyMember.length
    ? `${getEmoji("BLANK")}\`Member of\`\n${onlyMember
        .map(formatFunc(longestMember))
        .join("\n")}`
    : ""

  return `${ownerText}\n${memberText}`
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

  const embed = composeEmbedMessage(null, {
    thumbnail: member.user.displayAvatarURL(),
    author: [
      `${member.user.username}'s Mochi ID`,
      member.user.displayAvatarURL(),
    ],
    color: msgColors.BLUE,
  }).addFields([
    {
      name: "✦ STATS ✦",
      value: `\u200b${highestRole}\n\`Lvl. ${
        userProfile.current_level?.level ?? "N/A"
      } (${userProfile.guild_rank ?? 0}${suffixes.get(
        pr.select(userProfile.guild_rank ?? 0)
      )})\`\n\`Exp. ${userProfile.guild_xp}/${nextLevelMinXp}\``,
      inline: false,
    },
    {
      name: "Wallets",
      value: await renderWallets(mochiWallets, wallets),
      inline: false,
    },
    ...(vaults.length
      ? [
          {
            name: "Vaults",
            value: renderVaults(vaults, member.id),
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
          .setPlaceholder("View a wallet")
          .setCustomId("view_wallet")
          .addOptions(
            [
              ...mochiWallets.map((w) => ({ ...w, value: `mochi_${w.value}` })),
              ...wallets.map((w) => ({ ...w, value: `onchain_${w.value}` })),
            ].map((w, i) => ({
              emoji: getEmoji(`NUM_${i + 1}` as EmojiKey),
              label: shortenHashOrAddress(w.value.split("_")[1]),
              value: w.value,
            }))
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
          return `[${getEmoji("TWITTER")}](${TWITTER_USER_URL}/${
            s.platform_identifier
          })`
        } else if (s.platform === "telegram") {
          return `[${getEmoji("TELEGRAM")}](${TELEGRAM_USER_URL}/${
            s.platform_identifier
          })`
        }
      })
    )
  ).join("")
}

async function renderWallets(mochiWallets: any[], wallets: any[]) {
  const [mochiWalletsStr, walletsStr] = await Promise.all([
    await renderListWallet(getEmoji("NFT2"), "Mochi Wallets", mochiWallets, 0),
    await renderListWallet(
      getEmoji("WALLET_1"),
      "On-chain",
      wallets,
      mochiWallets.length
    ),
  ])

  return `${mochiWalletsStr}\n\n${walletsStr}`
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
