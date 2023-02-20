import community from "adapters/community"
import profile from "adapters/profile"
import { composeNFTDetail } from "commands/nft/query/processor"
import {
  ButtonInteraction,
  CommandInteraction,
  GuildMember,
  GuildMemberRoleManager,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
  User,
} from "discord.js"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import {
  authorFilter,
  emojis,
  getEmoji,
  hasAdministrator,
  shortenHashOrAddress,
} from "utils/common"

// TODO: this is a global var (one bot instance but multiple users are changing it - could lead to unpredictable error)
let currentCollectionAddress: string | undefined

type ViewType = "my-profile" | "my-nft"

function buildSwitchViewActionRow(currentView: ViewType) {
  const myProfileButton = new MessageButton({
    label: "My Profile",
    emoji: emojis.IDENTITY,
    customId: `profile-switch-view-button/my-profile}`,
    style: "SECONDARY",
    disabled: currentView === "my-profile",
  })
  const myNftButton = new MessageButton({
    label: "My NFT",
    emoji: getEmoji("NFTS"),
    customId: `profile-switch-view-button/my-nft`,
    style: "SECONDARY",
    disabled: currentView === "my-nft",
  })
  const row = new MessageActionRow()
  row.addComponents([myProfileButton, myNftButton])
  return row
}

function buildSelectCollectionActionRow(
  currentCollectionAddress: string,
  options: Array<{ collectionName: string; collectionAddress: string }>
) {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu({
      customId: "profile-select-nft-collection",
      placeholder: "Select nft collection",
      options: options
        .filter((o) => o.collectionName && o.collectionAddress)
        .map((o) => ({
          label: o.collectionName,
          description: `${o.collectionName} collection`,
          value: o.collectionAddress,
          default: o.collectionAddress === currentCollectionAddress,
        })),
    })
  )
  return row
}

function buildPaginationActionRow(page: number, totalPage: number) {
  if (totalPage === 1) return []
  const row = new MessageActionRow()
  if (page !== 0) {
    row.addComponents(
      new MessageButton({
        type: MessageComponentTypes.BUTTON,
        style: "PRIMARY",
        label: "Previous",
        customId: `profile-pagination-button/${page}/-/${totalPage}`,
      })
    )
  }

  if (page !== totalPage - 1) {
    row.addComponents({
      type: MessageComponentTypes.BUTTON,
      style: "PRIMARY",
      label: "Next",
      customId: `profile-pagination-button/${page}/+/${totalPage}`,
    })
  }
  return [row]
}

function collectButton(
  msg: Message,
  authorId: string,
  user: User,
  shouldHidePrivateInfo?: boolean
) {
  return msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(authorId),
    })
    .on("collect", async (i) => {
      const buttonType = i.customId.split("/").shift()
      switch (buttonType) {
        case "profile-switch-view-button":
          await switchView(i, msg, user, shouldHidePrivateInfo)
          break
        case "profile-pagination-button":
          await handlePagination(i, msg, user)
          break
      }
    })
    .on("end", () => {
      msg.edit({ components: [] }).catch(() => null)
    })
}

async function switchView(
  i: ButtonInteraction,
  msg: Message,
  user: User,
  shouldHidePrivateInfo?: boolean
) {
  let embed: MessageEmbed
  let components: MessageActionRow[] = []
  const nextView = (i.customId.split("/").pop() ?? "my-profile") as ViewType
  switch (nextView) {
    case "my-nft":
      ;({ embed, components } = await composeMyNFTEmbed(msg, user))
      break
    case "my-profile":
    default:
      ;({ embed, components } = await composeMyProfileEmbed(
        msg,
        user,
        shouldHidePrivateInfo
      ))
      break
  }
  await i
    .editReply({
      embeds: [embed],
      components: components,
    })
    .catch(() => null)
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
  const { embed, components } = await composeMyNFTEmbed(
    msg,
    user,
    currentCollectionAddress,
    page
  )
  await i
    .editReply({
      embeds: [embed],
      components: components,
    })
    .catch(() => null)
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
  currentCollectionAddress = i.values[0]
  const { embed, components } = await composeMyNFTEmbed(
    msg,
    user,
    currentCollectionAddress
  )
  await i
    .editReply({
      embeds: [embed],
      components: components,
    })
    .catch(() => null)
}

function buildProgressbar(progress: number): string {
  const list = new Array(7).fill(getEmoji("faction_exp_2"))
  list[0] = getEmoji("faction_exp_1")
  list[list.length - 1] = getEmoji("faction_exp_3")

  return list
    .map((_, i) => {
      if (Math.floor(progress * 7) >= i + 1) {
        switch (i) {
          case 0:
            return getEmoji("xp_filled_left", true)
          case 6:
            return getEmoji("xp_filled_right", true)
          default:
            return getEmoji("xp_filled", true)
        }
      }
      return _
    })
    .join("")
}

function buildXPbar(name: string, value: number) {
  const cap = Math.ceil(value / 1000) * 1000
  const list = new Array(7).fill(getEmoji("faction_exp_2"))
  list[0] = getEmoji("faction_exp_1")
  list[list.length - 1] = getEmoji("faction_exp_3")

  return `${list
    .map((_, i) => {
      if (Math.floor((value / cap) * 7) >= i + 1) {
        return i === 0
          ? getEmoji(`${name}_exp_1`, true)
          : getEmoji(`${name}_exp_2`, true)
      }
      return _
    })
    .join("")}\n\`${value}/${cap}\``
}

async function composeMyProfileEmbed(
  msg: Message | CommandInteraction,
  user: User,
  shouldHidePrivateInfo = false
) {
  const userProfileResp = await profile.getUserProfile(
    msg.guildId ?? "",
    user.id
  )
  if (!userProfileResp.ok) {
    const embed = getErrorEmbed({
      description: userProfileResp.error,
    })
    return {
      embed,
      components: [],
    }
  }

  const userProfile = userProfileResp.data
  let addressStr = userProfile.user_wallet?.address ?? ""
  addressStr = addressStr.length ? shortenHashOrAddress(addressStr) : "N/A"

  const lvlMax = 100
  const lvlStr = `\`${userProfile.current_level?.level}/${lvlMax}\``
  const levelProgress = buildProgressbar(
    (userProfile.current_level?.level ?? 0) / lvlMax
  )
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp

  const xpProgress = buildProgressbar(
    (userProfile?.guild_xp ?? 0) / (nextLevelMinXp ?? 1)
  )

  const xpStr = `\`${userProfile.guild_xp}/${nextLevelMinXp}\``

  const walletValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const protocolValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const nftValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const assetsStr = `Wallet: ${walletValue}\nProtocol: ${protocolValue}\nNFT: ${nftValue}`
  const roles = msg.member?.roles as GuildMemberRoleManager
  const highestRole = roles.highest.name !== "@everyone" ? roles.highest : null

  const roleStr = highestRole?.id ? `<@&${highestRole.id}>` : "`N/A`"
  const activityStr = `${getEmoji("FLAG")} \`${userProfile.nr_of_actions}\``
  const rankStr = `${getEmoji("TROPHY")} \`${userProfile.guild_rank ?? 0}\``

  const embed = composeEmbedMessage(null, {
    thumbnail: user.displayAvatarURL(),
    author: [`${user.username}'s profile`, user.displayAvatarURL()],
  }).addFields(
    { name: "Rank", value: rankStr, inline: true },
    { name: "Address", value: `\`${addressStr}\``, inline: true },
    {
      name: "Assets",
      value: assetsStr,
      inline: true,
    },
    { name: "Role", value: roleStr, inline: true },
    { name: "Activities", value: activityStr, inline: true },
    {
      name: "\u200B",
      value: "\u200B",
      inline: true,
    },
    {
      name: "Engagement Level",
      value: `${levelProgress}\n${lvlStr}`,
      inline: true,
    },
    {
      name: "Engagement XP",
      value: `${xpProgress}\n${xpStr}`,
      inline: true,
    },
    {
      name: "\u200B",
      value: "\u200B",
      inline: true,
    },
    {
      name: `${getEmoji("imperial")} Nobility`,
      value: buildXPbar(
        "imperial",
        userProfileResp.data.user_faction_xps?.imperial_xp ?? 0
      ),
      inline: true,
    },
    {
      name: `${getEmoji("rebelio")} Fame`,
      value: buildXPbar(
        "rebelio",
        userProfileResp.data.user_faction_xps?.rebellio_xp ?? 0
      ),
      inline: true,
    },
    {
      name: "\u200B",
      value: "\u200B",
      inline: true,
    },
    {
      name: `${getEmoji("mercanto")} Loyalty`,
      value: buildXPbar(
        "mercanto",
        userProfileResp.data.user_faction_xps?.merchant_xp ?? 0
      ),
      inline: true,
    },
    {
      name: `${getEmoji("academia")} Reputation`,
      value: buildXPbar(
        "academia",
        userProfileResp.data.user_faction_xps?.academy_xp ?? 0
      ),
      inline: true,
    },
    {
      name: getEmoji("blank"),
      value: getEmoji("blank"),
      inline: true,
    }
  )

  return {
    embed,
    components: [buildSwitchViewActionRow("my-profile")],
  }
}

async function composeMyNFTEmbed(
  msg: Message,
  user: User,
  collectionAddress?: string,
  pageIdx = 0
) {
  const userProfileResp = await profile.getUserProfile(
    msg.guildId ?? "",
    user.id
  )
  if (!userProfileResp.ok) {
    return {
      embed: getErrorEmbed({
        msg,
        description: userProfileResp.error,
      }),
      components: [],
    }
  }

  const userProfile = userProfileResp.data
  const userAddress = userProfile.user_wallet?.address
  if (!userAddress || !userAddress.length || userAddress === "N/A") {
    const verifyChannel = await community.getVerifyWalletChannel(
      msg.guildId ?? ""
    )
    let verifyCTA = ""
    if (verifyChannel.data?.verify_channel_id) {
      verifyCTA = `To link, just go to <#${verifyChannel.data.verify_channel_id}> and follow the instructions.`
    } else {
      verifyCTA =
        "It seems that this server doesn't have a channel to verify wallet, please contact administrators, thank you."
    }

    return {
      embed: getErrorEmbed({
        msg,
        title: "Wallet address needed",
        description: `Account doesn't have a wallet associated.\n${verifyCTA}`,
      }),
      components: [],
    }
  }

  const pageSize = 1
  const getUserNftResp = await profile.getUserNFT({
    userAddress,
    page: pageIdx,
    // size: pageSize,
  })
  if (!getUserNftResp.ok) {
    return {
      embed: getErrorEmbed({
        msg,
        description: getUserNftResp.error,
      }),
      components: [],
    }
  }
  const { total: userNftsTotal, data: userNfts } = getUserNftResp
  const totalPage = Math.ceil(userNftsTotal / pageSize)

  if (userNfts.length === 0) {
    const embed = composeEmbedMessage(msg, {
      author: [`${user.username}'s NFT collection`, user.displayAvatarURL()],
      description: `<@${user.id}>, you have no nfts.`,
    })
    return { embed, components: [buildSwitchViewActionRow("my-nft")] }
  }

  const userColAddresses = userNfts.map((n) => n.collection_address)
  const userCollections = (
    await Promise.all(
      userColAddresses
        .filter((addr, i) => userColAddresses.indexOf(addr) === i)
        .map((address) => profile.getNftCollections({ address }))
    )
  )
    .filter((res) => res.ok)
    .map((res) => res.data?.[0])
    .filter((c) => Boolean(c))

  if (userCollections.length === 0) {
    const embed = composeEmbedMessage(msg, {
      author: [`${user.username}'s NFT collection`, user.displayAvatarURL()],
      description: `<@${user.id}>, you have no nfts.`,
    })
    return { embed: embed, components: [buildSwitchViewActionRow("my-nft")] }
  }

  const selectedCollection =
    userCollections.find((c) => c?.collection_address === collectionAddress) ??
    userCollections[0]
  const { name: colName, image: colImage } = selectedCollection ?? {}

  const userNft = userNfts.find(
    (userNft) =>
      userNft.collection_address === selectedCollection?.collection_address
  )
  const getNftDetailResp = await community.getNFTDetail(
    userNft?.collection_address ?? "",
    userNft?.token_id ?? "",
    msg.guildId ?? "",
    true
  )
  if (!getNftDetailResp.ok) {
    return {
      embed: getErrorEmbed({
        msg,
        description: getNftDetailResp.error,
      }),
      components: [],
    }
  }
  const { data: nftDetail } = getNftDetailResp
  const embed = await composeNFTDetail(
    nftDetail,
    msg,
    colName ?? "",
    colImage ?? ""
  )
  embed.setFooter({ text: `Page ${pageIdx + 1} / ${totalPage}` })

  const options = userCollections.map((c) => ({
    collectionName: c?.name ?? "",
    collectionAddress: c?.collection_address ?? "",
  }))

  return {
    embed,
    components: [
      ...buildPaginationActionRow(pageIdx, totalPage),
      buildSelectCollectionActionRow(
        selectedCollection?.collection_address ?? "",
        options
      ),
      buildSwitchViewActionRow("my-nft"),
    ],
  }
}

export async function handleProfile(
  msg: Message | CommandInteraction,
  args: string[]
) {
  const shouldHidePrivateInfo = !hasAdministrator(<GuildMember>msg.member)

  // get users
  const users: User[] = []
  if (args.length > 1) {
    const { isUser, value: id } = parseDiscordToken(args[1])
    if (isUser) {
      const cachedUser = msg.guild?.members.cache.get(id)?.user
      if (cachedUser) {
        users.push(cachedUser)
      }
    } else {
      const usersFoundByDisplayname: User[] = []
      const usersFoundByUsername: User[] = []
      await msg.guild?.members?.fetch()?.then((members) => {
        members.forEach((member) => {
          if (member.user.username === args[1]) {
            usersFoundByUsername.push(member.user)
          } else if (member.displayName === args[1]) {
            usersFoundByDisplayname.push(member.user)
          }
        })
      })

      users.push(...usersFoundByUsername, ...usersFoundByDisplayname)
    }
  } else {
    const author = msg instanceof Message ? msg.author : msg.user
    users.push(author)
  }

  for (const user of users.values()) {
    const author = msg instanceof Message ? msg.author : msg.user
    const { embed, components } = await composeMyProfileEmbed(
      msg,
      user,
      shouldHidePrivateInfo
    )
    let replyMsg
    if (msg instanceof CommandInteraction) {
      replyMsg = (await msg.editReply({
        embeds: [embed],
        components: components,
      })) as Message
    } else {
      replyMsg = (await msg.reply({
        embeds: [embed],
        components: components,
      })) as Message
    }
    collectButton(replyMsg, author.id, user, shouldHidePrivateInfo)
    collectSelectMenu(replyMsg, author.id, user)
  }

  if (users.length == 0) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "No profile found",
          }),
        ],
      },
    }
  }

  return null
}
