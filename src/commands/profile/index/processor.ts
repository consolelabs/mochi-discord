import community from "adapters/community"
import profile from "adapters/profile"
import { commands } from "commands"
import {
  ButtonInteraction,
  Collection,
  CommandInteraction,
  EmbedFieldData,
  GuildMember,
  GuildMemberRoleManager,
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
import {
  EMPTY_FIELD,
  composeEmbedMessage,
  getErrorEmbed,
} from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  authorFilter,
  emojis,
  getEmoji,
  getEmojiURL,
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
    emoji: getEmoji("winkingface"),
    customId: `profile-switch-view-button/my-profile`,
    style: "SECONDARY",
    disabled: currentView === "my-profile",
  })
  const myWalletBtn = new MessageButton({
    label: "My Wallets",
    emoji: getEmoji("wallet_1"),
    customId: `profile-switch-view-button/my-wallets`,
    style: "SECONDARY",
    disabled: currentView === "my-wallets",
  })
  const myNftButton = new MessageButton({
    label: "My NFT",
    emoji: getEmoji("nfts"),
    customId: `profile-switch-view-button/my-nft`,
    style: "SECONDARY",
    disabled: currentView === "my-nft",
  })
  const addWalletBtn = new MessageButton({
    label: "Add Wallet",
    emoji: getEmoji("plus"),
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
    .on("collect", async (i) =>
      wrapError(msg, async () => {
        const buttonType = i.customId.split("/").shift()
        switch (buttonType) {
          case "profile-switch-view-button":
            await switchView(i, msg, user)
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

async function switchView(i: ButtonInteraction, msg: Message, user: User) {
  let replyPayload
  const nextView = (i.customId.split("/").pop() ?? "my-profile") as ViewType
  await i.deferReply()
  switch (nextView) {
    case "my-nft":
      replyPayload = await composeMyNFTResponse(msg, user)
      break
    case "my-wallets":
      replyPayload = await composeMyWalletsResponse(msg, user)
      break
    case "my-profile":
    default:
      replyPayload = await composeMyProfileEmbed(msg, user)
      break
  }
  i.editReply(replyPayload)
    .then((reply) => collectButton(reply as Message, user.id, user))
    .catch(() => null)
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
  const pointingright = getEmoji("pointingright")
  let description: string
  if (!myWallets.length) {
    description = `You have no wallets.\n${pointingright} Add more wallet \`/wallet add\``
  } else {
    // maximum 9 wallets for now
    const list = await Promise.all(
      myWallets.slice(0, 9).map(async (w: any, i: number) => {
        const domain = `${(await reverseLookup(w)) || ""}`
        return `${getEmoji(`num_${i + 1}`)} \`${shortenHashOrAddress(
          w
        )}\` ${domain}`
      })
    )
    description = `\n${list.join(
      "\n"
    )}\n\n${pointingright} Choose a wallet to customize assets \`/wallet view label\` or \`/wallet view address\`\n/wallet view wal1 or /wallet view baddeed.eth (In case you have set label)\n${pointingright} Add more wallet \`/wallet add\`\n\u200B`
  }
  const embed = composeEmbedMessage(msg, {
    author: [`${user.username}'s profile`, user.displayAvatarURL()],
    description: `**✦ MY WALLETS ✦**\n${description}`,
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
    iconURL: getEmojiURL(emojis.POINTINGDOWN),
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

// function buildXPbar(name: string, value: number) {
//   const cap = Math.ceil(value / 1000) * 1000
//   const list = new Array(7).fill(getEmoji("faction_exp_2"))
//   list[0] = getEmoji("faction_exp_1")
//   list[list.length - 1] = getEmoji("faction_exp_3")

//   return `${list
//     .map((_, i) => {
//       if (Math.floor((value / cap) * 7) >= i + 1) {
//         return i === 0
//           ? getEmoji(`${name}_exp_1`, true)
//           : getEmoji(`${name}_exp_2`, true)
//       }
//       return _
//     })
//     .join("")}\n\`${value}/${cap}\``
// }

async function composeMyProfileEmbed(msg: OriginalMessage, user: User) {
  const {
    data: userProfile,
    ok,
    curl,
    log,
  } = await profile.getUserProfile(msg.guildId ?? "", user.id)
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, description: log, curl })
  }

  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp
  const xpStr = `${getEmoji("xp2")} \`${
    userProfile.guild_xp
  }/${nextLevelMinXp}\``
  const roles = msg.member?.roles as GuildMemberRoleManager
  const highestRole = roles.highest.name !== "@everyone" ? roles.highest : null
  const activityStr = `\`${userProfile.nr_of_actions}\``
  const rankStr = `${getEmoji("trophy")} \`#${userProfile.guild_rank ?? 0}\``
  // const { academy_xp, imperial_xp, merchant_xp, rebellio_xp } =
  //   userProfile.user_faction_xps ?? {}

  const embed = composeEmbedMessage(null, {
    thumbnail: user.displayAvatarURL(),
    author: [`${user.username}'s profile`, user.displayAvatarURL()],
    color: msgColors.PINK,
  }).addFields(
    {
      name: "✦ STATS ✦\n\nRole",
      value: `${highestRole ?? `N/A`}`,
      inline: true,
    },
    EMPTY_FIELD,
    { name: "\u200B\n\nRank", value: rankStr, inline: true },
    {
      name: "Level",
      value: `${getEmoji("ARROW_UP")} \`${
        userProfile.current_level?.level ?? "N/A"
      }\``,
      inline: true,
    },
    EMPTY_FIELD,
    { name: "Total XP", value: xpStr, inline: true },
    { name: "Activities", value: activityStr, inline: true }
    // EMPTY_FIELD,
    // EMPTY_FIELD,
    // {
    //   name: `\u200B\n✦ APPELLATION ✦\n\n${getEmoji("imperial")} Nobility`,
    //   value: buildXPbar("imperial", imperial_xp ?? 0),
    //   inline: true,
    // },
    // EMPTY_FIELD,
    // {
    //   name: `\u200B\n\n\n${getEmoji("rebelio")} Fame`,
    //   value: buildXPbar("rebelio", rebellio_xp ?? 0),
    //   inline: true,
    // },
    // {
    //   name: `${getEmoji("mercanto")} Loyalty`,
    //   value: buildXPbar("mercanto", merchant_xp ?? 0),
    //   inline: true,
    // },
    // EMPTY_FIELD,
    // {
    //   name: `${getEmoji("academia")} Reputation`,
    //   value: buildXPbar("academia", academy_xp ?? 0) + "\n\u200B",
    //   inline: true,
    // }
  )
  setProfileFooter(embed)
  return {
    embeds: [embed],
    components: [buildSwitchViewActionRow("my-profile", user.id)],
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
      embed: getErrorEmbed({
        msg,
        title: "Wallet address needed",
        description: `Account doesn't have a wallet associated.\n${verifyCTA}`,
      }),
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
        collections.data?.[0].name ||
        `Collection ${shortenHashOrAddress(address)}`
      const chainId = collections.data?.[0].chain_id
      const nftEmoji = getEmoji("nft")
      const tokens = nfts
        .map((nft) =>
          chainId
            ? `[\`#${nft.token_id}\`](${CHAIN_EXPLORER_BASE_URLS[chainId]}/token/${address}?a=${nft.token_id})`
            : `\`${nft.token_id}\``
        )
        .join(", ")
      return {
        name: `${nftEmoji} ${collectionName}`,
        value: tokens,
        inline: true,
      }
    })
  )

  const pointingright = getEmoji("pointingright")
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
  // get users
  const users: User[] = []
  if (query) {
    const { isUser, value: id } = parseDiscordToken(query)
    if (isUser) {
      const cachedUser = msg.guild?.members.cache.get(id)?.user
      if (cachedUser) users.push(cachedUser)
    } else {
      const members = await msg.guild?.members?.fetch()
      users.push(
        ...(members ?? new Collection<string, GuildMember>())
          .filter((m) => [m.user.username, m.displayName].includes(query))
          .map((m) => m.user)
      )
    }
  } else {
    users.push(msg instanceof Message ? msg.author : msg.user)
  }

  if (!users.length) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: "No profile found" })],
      },
    }
  }

  for (const user of users) {
    // send activity
    const dataProfile = await profile.getByDiscord(user.id)
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
    kafkaMsg.activity.content.username = user.username
    sendActivityMsg(kafkaMsg)

    const author = msg instanceof Message ? msg.author : msg.user
    const replyPayload = await composeMyProfileEmbed(msg, user)
    const reply = (
      msg instanceof CommandInteraction
        ? await msg.editReply(replyPayload)
        : await msg.reply(replyPayload)
    ) as Message
    collectButton(reply, author.id, user)
    collectSelectMenu(reply, author.id, user)
  }
}
