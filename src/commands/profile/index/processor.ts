import community from "adapters/community"
import profile from "adapters/profile"
import { commands } from "commands"
import {
  ButtonInteraction,
  Collection,
  CommandInteraction,
  EmbedFieldData,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { APIError, OriginalMessage } from "errors"
import { UserNFT } from "types/profile"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  authorFilter,
  emojis,
  getEmoji,
  getEmojiURL,
  isAddress,
  msgColors,
  removeDuplications,
  reverseLookup,
  shortenHashOrAddress,
} from "utils/common"
import { CHAIN_EXPLORER_BASE_URLS, SPACE } from "utils/constants"
import { wrapError } from "utils/wrap-error"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_PROFILE,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"

// @anhnh TODO: all of this need to be refactored
type ViewType = "my-profile" | "my-nft" | "my-wallets"

function buildSwitchViewActionRow(currentView: ViewType, userId: string) {
  const myProfileButton = new MessageButton({
    label: "My Profile",
    emoji: getEmoji("WINKINGFACE"),
    customId: `profile-switch-view-button/my-profile`,
    style: "SECONDARY",
    disabled: currentView === "my-profile",
  })
  const myWalletBtn = new MessageButton({
    label: "My Wallets",
    emoji: getEmoji("WALLET_1"),
    customId: `profile-switch-view-button/my-wallets`,
    style: "SECONDARY",
    disabled: currentView === "my-wallets",
  })
  const myNftButton = new MessageButton({
    label: "My NFT",
    emoji: getEmoji("NFTS"),
    customId: `profile-switch-view-button/my-nft`,
    style: "SECONDARY",
    disabled: currentView === "my-nft",
  })
  const addWalletBtn = new MessageButton({
    label: "Add Wallet",
    emoji: getEmoji("PLUS"),
    customId: `wallet_add_more-${userId}`,
    style: "SECONDARY",
  })
  const row = new MessageActionRow()
  row.addComponents([myProfileButton, myWalletBtn, myNftButton, addWalletBtn])
  return row
}

function collectButton(msg: Message, authorId: string, user: User) {
  return msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", (i) =>
      wrapError(msg, async () => {
        const [buttonType, nextView] = i.customId.split("/")
        switch (buttonType) {
          case "profile-switch-view-button":
            await switchView(i, msg, nextView as ViewType)
            break
          case "profile-pagination-button":
            await handlePagination(i, msg, user)
            break
        }
      })
    )
    .on("end", () => {
      msg.edit({ components: [] }).catch(() => null)
    })
}

async function switchView(
  i: ButtonInteraction,
  msg: Message,
  nextView: ViewType
) {
  let replyPayload
  await i.deferUpdate()
  if (!i.member) return
  switch (nextView) {
    case "my-nft":
      replyPayload = await composeMyNFTResponse(msg, i.user)
      break
    case "my-wallets":
      replyPayload = await composeMyWalletsResponse(msg, i.user)
      break
    case "my-profile":
    default:
      replyPayload = await composeMyProfileEmbed(msg, i.member as GuildMember)
      break
  }
  msg
    .edit(replyPayload)
    .then((reply) => collectButton(reply as Message, msg.author.id, msg.author))
    .catch(() => null)
}

async function renderListWallet(wallets: any[]) {
  let longestAddr = 0
  let longestDomain = 0
  let longestChain = 0
  const domains = await Promise.all(
    wallets.map(async (w) => await reverseLookup(w))
  )
  for (const [i, w] of wallets.entries()) {
    longestAddr = Math.max(shortenHashOrAddress(w).length, longestAddr)
    longestDomain = Math.max(domains[i].length, longestDomain)
    longestChain = Math.max(isAddress(w).type.length, longestChain)
  }
  return wallets.slice(0, 5).map((w: any, i) => {
    const isAllDomainsEmpty = domains.every((d) => d.trim() === "")
    return `\`${isAddress(w).type.toUpperCase()}${" ".repeat(
      longestChain - isAddress(w).type.length
    )} | ${shortenHashOrAddress(w)}${" ".repeat(
      longestAddr - shortenHashOrAddress(w).length
    )} |${
      isAllDomainsEmpty ? " ".repeat(10) : domains[i] ? " " + domains[i] : " "
    }${" ".repeat(longestDomain - domains[i].length)}\``
  })
}

async function composeMyWalletsResponse(msg: Message, user: User) {
  const pfRes = await profile.getByDiscord(user.id)
  if (pfRes.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${pfRes.status_code}`,
      curl: "",
    })
  }
  const myWallets = removeDuplications(
    pfRes.associated_accounts
      ?.filter((a: any) => ["evm-chain", "solana-chain"].includes(a.platform))
      ?.map((w: any) => w.platform_identifier) ?? []
  )
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  let description: string
  if (!myWallets.length) {
    description = `You have no wallets.\n${pointingright} Add more wallet \`/wallet add\``
  } else {
    const list = await renderListWallet(myWallets)

    description = `\n${list.join(
      "\n"
    )}\n\n${pointingright} Choose a wallet to customize assets \`/wallet view label\` or \`/wallet view address\`\n/wallet view wal1 or /wallet view baddeed.eth (In case you have set label)\n${pointingright} Add more wallet \`/wallet add\`\n\u200B`
  }
  const embed = composeEmbedMessage(msg, {
    author: [`${user.username}'s profile`, user.displayAvatarURL()],
    description: `**✦ MY WALLETS ✦**${description}`,
    color: msgColors.PINK,
  })
  setProfileFooter(embed)
  return {
    embeds: [embed],
    components: [buildSwitchViewActionRow("my-wallets", user.id)],
  }
}

const setProfileFooter = (embed: MessageEmbed) => {
  embed.setFooter({
    text: "Select the categories below to see more assets!",
    iconURL: getEmojiURL(emojis.ANIMATED_POINTING_DOWN),
  })
}

async function handlePagination(
  i: ButtonInteraction,
  msg: Message,
  user: User
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }
  const [pageStr, opStr] = i.customId.split("/").slice(1)
  const page = +pageStr + operators[opStr]
  const replyPayload = await composeMyNFTResponse(msg, user, page)
  await i.editReply(replyPayload).catch(() => null)
}

function collectSelectMenu(msg: Message, authorId: string, user: User) {
  return msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.SELECT_MENU,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", async (i) => {
      await selectCollection(i, msg, user)
    })
    .on("end", () => {
      msg.edit({ components: [] }).catch(() => null)
    })
}

async function selectCollection(
  i: SelectMenuInteraction,
  msg: Message,
  user: User
) {
  const replyPayload = await composeMyNFTResponse(msg, user)
  await i.editReply(replyPayload).catch(() => null)
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" })
const suffixes = new Map([
  ["one", "st"],
  ["two", "nd"],
  ["few", "rd"],
  ["other", "th"],
])

async function composeMyProfileEmbed(
  msg: OriginalMessage,
  member: GuildMember
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
  const dataProfile = await profile.getByDiscord(member.id)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }

  const wallets = removeDuplications(
    dataProfile.associated_accounts
      ?.filter((a: any) => ["evm-chain", "solana-chain"].includes(a.platform))
      ?.map((w: any) => w.platform_identifier) ?? []
  )
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp
  const highestRole =
    member.roles.highest.name !== "@everyone" ? member.roles.highest : null
  // const activityStr = `\`${userProfile.nr_of_actions}\``
  // const { academy_xp, imperial_xp, merchant_xp, rebellio_xp } =
  //   userProfile.user_faction_xps ?? {}

  const embed = composeEmbedMessage(null, {
    thumbnail: member.user.displayAvatarURL(),
    author: [
      `${member.user.username}'s profile`,
      member.user.displayAvatarURL(),
    ],
    color: msgColors.PINK,
  }).addFields([
    {
      name: "✦ STATS ✦",
      value: `${highestRole}\n\`Lvl. ${
        userProfile.current_level?.level ?? "N/A"
      } (${userProfile.guild_rank ?? 0}${suffixes.get(
        pr.select(userProfile.guild_rank ?? 0)
      )})\`\n\`Exp. ${userProfile.guild_xp}/${nextLevelMinXp}\``,
      inline: false,
    },
    {
      name: "Wallets",
      value: (await renderListWallet(wallets)).join("\n"),
      inline: false,
    },
  ])
  setProfileFooter(embed)
  return {
    embeds: [embed],
    components: [buildSwitchViewActionRow("my-profile", member.user.id)],
  }
}

async function composeMyNFTResponse(msg: Message, user: User, pageIdx = 0) {
  const userProfile = await profile.getUserProfile(msg.guildId, user.id)
  if (!userProfile.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: userProfile.curl,
      description: userProfile.log,
    })
  }

  const userAddress = userProfile.data.user_wallet?.address
  if (!userAddress) {
    const verifyChannel = await community.getVerifyWalletChannel(msg.guildId)
    const verifyCTA = verifyChannel.data?.verify_channel_id
      ? `To link, just go to <#${verifyChannel.data.verify_channel_id}> and follow the instructions.`
      : "It seems that this server doesn't have a channel to verify wallet, please contact administrators, thank you."
    return {
      embeds: [
        getErrorEmbed({
          msg,
          title: "Wallet address needed",
          description: `Account doesn't have a wallet associated.\n${verifyCTA}`,
        }),
      ],
      components: [],
    }
  }

  const userNFTs = await profile.getUserNFT({
    userAddress,
    page: pageIdx,
  })
  if (!userNFTs.ok) {
    throw new APIError({
      msgOrInteraction: msg,
      curl: userNFTs.curl,
      description: userNFTs.log,
    })
  }

  const fields: EmbedFieldData[] = await Promise.all(
    // group nfts by collection
    Object.entries(
      userNFTs.data.reduce((acc: Record<string, UserNFT[]>, cur) => {
        const nfts = acc[cur.collection_address] ?? []
        nfts.push(cur)
        return {
          ...acc,
          [cur.collection_address]: nfts,
        }
      }, {})
      // render embed fields
    ).map(async ([address, nfts]) => {
      const collections = await profile.getNftCollections({ address })
      const collectionName =
        collections.data?.[0]?.name ||
        `Collection ${shortenHashOrAddress(address)}`
      const chainId = collections.data?.[0]?.chain_id ?? ""
      const nftEmoji = getEmoji("NFT")
      const tokens = nfts
        .slice(0, 5)
        .map((nft) =>
          chainId
            ? `[\`#${nft.token_id}\`](${CHAIN_EXPLORER_BASE_URLS[chainId]}/token/${address}?a=${nft.token_id})`
            : `\`${nft.token_id}\``
        )
        .join(", ")
      return {
        name: `${nftEmoji} ${collectionName}`,
        value: `${tokens}${nfts.length > 5 ? ", ..." : ""}`,
        inline: true,
      }
    })
  )

  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  const nftCommands = Object.keys(commands["nft"].actions ?? {})
    .map((c) => `\`nft ${c}\``)
    .join(SPACE)
  fields.push({
    name: "\u200B",
    value: `${pointingright} Select an NFT to view detail \`/nft symbol tokenID\` e.g. /nft neko 1\n${pointingright} NFT commands ${nftCommands}\n\u200B`,
  })
  const embed = composeEmbedMessage(msg, {
    author: [`${user.username}'s profile`, user.displayAvatarURL()],
    description: `**✦ MY NFT ✦**\n\u200B`,
    color: msgColors.PINK,
  }).addFields(fields)
  setProfileFooter(embed)
  return {
    embeds: [embed],
    components: [buildSwitchViewActionRow("my-nft", user.id)],
  }
}

export async function render(msg: OriginalMessage, query?: string | null) {
  // get members
  let members: GuildMember[] = []
  if (query) {
    const { isUser, value: id } = parseDiscordToken(query)
    if (isUser) {
      const cachedMember = msg.guild?.members.cache.get(id)
      if (cachedMember) members.push(cachedMember)
    } else {
      const currentMembers = await msg.guild?.members?.fetch()
      members.push(
        ...(currentMembers ?? new Collection<string, GuildMember>())
          .filter((m) => [m.user.username, m.displayName].includes(query))
          .map((m) => m)
      )
    }
  } else {
    members.push(msg.member as GuildMember)
  }

  members = members.filter(Boolean)

  if (!members.length) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: "No profile found" })],
      },
    }
  }

  for (const mem of members) {
    // send activity
    const dataProfile = await profile.getByDiscord(mem.user.id)
    if (dataProfile.err) {
      throw new APIError({
        msgOrInteraction: msg,
        description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
        curl: "",
      })
    }
    const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
      dataProfile.id,
      MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      MOCHI_APP_SERVICE,
      MOCHI_ACTION_PROFILE
    )
    kafkaMsg.activity.content.username = mem.user.username
    sendActivityMsg(kafkaMsg)

    const author = msg instanceof Message ? msg.author : msg.user
    const replyPayload = await composeMyProfileEmbed(msg, mem)
    const reply = (
      msg instanceof CommandInteraction
        ? await msg.editReply(replyPayload).catch(() => {
            replyPayload.embeds[0].fields.pop()
            return msg.editReply(replyPayload)
          })
        : await msg.reply(replyPayload).catch(() => {
            replyPayload.embeds[0].fields.pop()
            return msg.reply({ ...replyPayload, fetchReply: true })
          })
    ) as Message
    collectButton(reply, author.id, mem.user)
    collectSelectMenu(reply, author.id, mem.user)
  }
}
