import profile from "adapters/profile"
import { CommandInteraction, GuildMember } from "discord.js"
import { APIError, InternalError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  isAddress,
  msgColors,
  removeDuplications,
  reverseLookup,
  shortenHashOrAddress,
} from "utils/common"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_PROFILE,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"
import mochiPay from "adapters/mochi-pay"
import { uniqBy } from "lodash"

async function renderListWallet(
  title: string,
  _wallets: { value: string; chain?: string }[]
) {
  let longestAddr = 0
  let longestDomain = 0
  let longestChain = 0
  // shows only 5
  const wallets = _wallets.slice(0, 5)
  const domains = await Promise.all(
    wallets.map(async (w) => await reverseLookup(w.value))
  )
  for (const [i, w] of wallets.entries()) {
    longestAddr = Math.max(shortenHashOrAddress(w.value, 4).length, longestAddr)
    longestDomain = Math.max(domains[i].length, longestDomain)
    const chainName = (w.chain || isAddress(w.value).type).toUpperCase()
    longestChain = Math.max(chainName.length, longestChain)
  }
  const arr = wallets.map((w, i) => {
    const isAllDomainsEmpty = domains.every((d) => d.trim() === "")
    const chainName = (w.chain || isAddress(w.value).type).toUpperCase()
    const shortenAddr = shortenHashOrAddress(w.value, 4)
    const formattedString = `\`${chainName}${" ".repeat(
      longestChain - chainName.length
    )} | ${shortenAddr}${" ".repeat(longestAddr - shortenAddr.length)} ${
      isAllDomainsEmpty ? " " : domains[i] ? "| " + domains[i] : "  "
    }${" ".repeat(longestDomain - domains[i].length)}\``
    return formattedString
  })

  if (!arr) return ""

  return `\`${title}\`\n${arr.join("\n")}`
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" })
const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
])

async function compose(msg: OriginalMessage, member: GuildMember) {
  const {
    data: userProfile,
    ok,
    curl,
    log,
  } = await profile.getUserProfile(msg.guildId ?? "", member.user.id)
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, description: log, curl })
  }
  const dataProfile = await profile.getByDiscord(member.id)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }

  const { data: mochiWalletsRes, ok: mochiWalletsResOk } =
    await mochiPay.getMochiWalletsByProfileId(dataProfile.id)
  let mochiWallets = []
  if (mochiWalletsResOk) {
    mochiWallets = mochiWalletsRes as any[]
  }

  mochiWallets = uniqBy(mochiWallets, (mw) => mw.wallet_address)

  const wallets = removeDuplications(
    dataProfile.associated_accounts
      ?.filter((a: any) => ["evm-chain", "solana-chain"].includes(a.platform))
      ?.map((w: any) => ({
        value: w.platform_identifier,
        chain: w.platform === "evm-chain" ? "EVM" : "SOL",
      })) ?? []
  )
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
      value: `${await renderListWallet(
        "– Mochi Wallet -",
        mochiWallets.map((m) => ({
          value: m.wallet_address,
          chain: m.chain?.is_evm ? "EVM" : m.chain?.symbol,
        }))
      )}\n\n${await renderListWallet("– On-chain –", wallets)}`,
      inline: false,
    },
  ])
  return {
    embeds: [embed],
  }
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

  const replyPayload = await compose(msg, member)

  if (msg instanceof CommandInteraction) {
    msg.editReply(replyPayload).catch(() => {
      replyPayload.embeds[0].fields.pop()
      msg.editReply(replyPayload)
    })
  } else {
    msg.reply(replyPayload).catch(() => {
      replyPayload.embeds[0].fields.pop()
      msg.reply(replyPayload)
    })
  }
}
