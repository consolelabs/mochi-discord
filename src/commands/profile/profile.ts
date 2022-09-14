import profile from "adapters/profile"
import {
  Message,
  MessageActionRow,
  MessageSelectMenu,
  MessageOptions,
  MessageSelectOptionData,
  User,
} from "discord.js"
import { Command } from "types/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import { getEmoji, hasAdministrator, shortenHashOrAddress } from "utils/common"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { logger } from "logger"
import { composeNFTDetail } from "commands/community/nft/query"
import community from "adapters/community"
import { parseDiscordToken, getCommandArguments } from "utils/commands"

function selectCollectionComponent(
  collections: {
    name: string
    collectionAddress: string
    default: boolean
  }[]
) {
  const options: MessageSelectOptionData[] = []
  collections.forEach((collection) => {
    options.push({
      label: collection.name,
      description: `${collection.name} collection`,
      value: collection.collectionAddress,
      default: collection.default,
    })
  })

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("selectCollection")
      .setPlaceholder("Other collections...")
      .addOptions(options)
  )
  return row
}

function selectOtherViewComponent(defaultValue?: string) {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("selectView")
      .setPlaceholder("Other views...")
      .addOptions([
        {
          label: "My NFT Collections",
          description: "NFT details",
          value: "nft",
          default: defaultValue == "nft",
        },
        {
          label: "My profile",
          description: "My Profile Info",
          value: "profile",
          default: defaultValue == "profile",
        },
      ])
  )
  return row
}

function buildProgressbar(progress: number): string {
  const progressBar = [
    getEmoji("EXP_1_EMPTY"),
    getEmoji("EXP_2_EMPTY"),
    getEmoji("EXP_2_EMPTY"),
    getEmoji("EXP_2_EMPTY"),
    getEmoji("EXP_2_EMPTY"),
    getEmoji("EXP_3_EMPTY"),
  ]
  const maxBar = 6
  const progressOutOfMaxBar = Math.round(progress * maxBar)
  for (let i = 0; i <= progressOutOfMaxBar; ++i) {
    if (progressOutOfMaxBar == 0) break
    let barEmote = "EXP_2_FULL"
    if (i == 1) {
      barEmote = i == progressOutOfMaxBar ? "EXP_1_MID" : "EXP_1_FULL"
    } else if (i > 1 && i < maxBar) {
      barEmote = i == progressOutOfMaxBar ? "EXP_2_MID" : "EXP_2_FULL"
    } else {
      barEmote = i == progressOutOfMaxBar ? "EXP_3_MID" : "EXP_3_FULL"
    }
    progressBar[i - 1] = getEmoji(barEmote, true)
  }
  return progressBar.join("")
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
  msg: Message,
  user: User,
  shouldHidePrivateInfo = false
): Promise<MessageOptions> {
  const userProfileResp = await profile.getUserProfile(
    msg.guildId ?? "",
    user.id
  )
  if (!userProfileResp.ok) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description: userProfileResp.error,
        }),
      ],
    }
  }
  const userProfile = userProfileResp.data

  let addressStr = userProfile.user_wallet?.address ?? ""
  if (!addressStr.length) {
    addressStr = "N/A"
  } else {
    addressStr = shouldHidePrivateInfo
      ? shortenHashOrAddress(addressStr)
      : addressStr
  }

  const lvlStr = `\`${userProfile.current_level?.level}\``
  const lvlMax = 60
  const levelProgress = buildProgressbar(
    (userProfile.current_level?.level ?? 0) / lvlMax
  )
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp

  const xpProgress = buildProgressbar(
    (userProfile?.guild_xp ?? 0) / (nextLevelMinXp ?? 0)
  )

  const xpStr = `\`${userProfile.guild_xp}/${
    userProfile.next_level?.min_xp
      ? userProfile.next_level.min_xp
      : userProfile.current_level?.min_xp
  }\``

  const walletValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const protocolValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const nftValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const assetsStr = `Wallet: ${walletValue}\nProtocol: ${protocolValue}\nNFT: ${nftValue}`
  const highestRole =
    msg.member?.roles.highest.name !== "@everyone"
      ? msg.member?.roles.highest
      : null

  const roleStr = highestRole?.id ? `<@&${highestRole.id}>` : "`N/A`"
  const activityStr = `${getEmoji("FLAG")} \`${userProfile.nr_of_actions}\``
  const rankStr = `:trophy: \`${userProfile.guild_rank ?? 0}\``

  const embed = composeEmbedMessage(msg, {
    thumbnail: user.displayAvatarURL(),
    author: [`${user.username}'s profile`, user.displayAvatarURL()],
  }).addFields(
    {
      name: "Level",
      value: `${lvlStr} \n ${levelProgress}`,
      inline: true,
    },
    {
      name: "Experience",
      value: `${xpStr} \n ${xpProgress}`,
      inline: true,
    },
    {
      name: "Assets",
      value: assetsStr,
      inline: true,
    },
    { name: "Address", value: `\`${addressStr}\`` },
    { name: "Role", value: roleStr, inline: true },
    { name: "Activities", value: activityStr, inline: true },
    { name: "Rank", value: rankStr, inline: true },
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
      name: getEmoji("blank"),
      value: getEmoji("blank"),
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
    embeds: [embed],
    components: [selectOtherViewComponent("profile")],
  }
}

async function composeMyNFTEmbed(
  msg: Message,
  user: User,
  collectionAddress?: string,
  page = 0
): Promise<MessageOptions> {
  const userProfileResp = await profile.getUserProfile(
    msg.guildId ?? "",
    user.id
  )
  if (!userProfileResp.ok) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description: userProfileResp.error,
        }),
      ],
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
      embeds: [
        getErrorEmbed({
          msg,
          title: "Wallet address needed",
          description: `Account doesn't have a wallet associated.\n${verifyCTA}`,
        }),
      ],
    }
  }

  const userNftCollectionResp = await profile.getUserNFTCollection({
    userAddress,
  })
  if (!userNftCollectionResp.ok) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description: userNftCollectionResp.error,
        }),
      ],
    }
  }

  const userNftCollections = userNftCollectionResp.data
  if (userNftCollections.length === 0) {
    const embed = composeEmbedMessage(msg, {
      author: [`${user.username}'s NFT collection`, user.displayAvatarURL()],
      description: `<@${user.id}>, you have no nfts.`,
    })
    return { embeds: [embed], components: [selectOtherViewComponent()] }
  }

  const currentSelectedCollection =
    userNftCollections.find(
      (collection) => collection.collection_address === collectionAddress
    ) ?? userNftCollections[0]

  const { name: colName, image: colImage } = currentSelectedCollection
  const pageSize = 1

  const getUserNftResp = await profile.getUserNFT({
    userAddress,
    collectionAddress: currentSelectedCollection.collection_address,
    page: page,
    size: pageSize,
  })
  if (!getUserNftResp.ok) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description: getUserNftResp.error,
        }),
      ],
    }
  }
  const { total: userNftsTotal, data: userNfts } = getUserNftResp
  const totalPage = Math.ceil(userNftsTotal / pageSize)

  if (userNfts.length === 0) {
    const embed = composeEmbedMessage(msg, {
      author: [`${user.username}'s NFT collection`, user.displayAvatarURL()],
      description: `<@${user.id}>, you have no nfts.`,
    })
    return { embeds: [embed], components: [selectOtherViewComponent()] }
  }

  const userNft = userNfts[0]
  const getNftDetailResp = await profile.getNFTDetails({
    collectionAddress: userNft.collection_address,
    tokenId: userNft.token_id,
  })
  if (!getNftDetailResp.ok) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description: getNftDetailResp.error,
        }),
      ],
    }
  }
  const { data: nftDetail } = getNftDetailResp
  const embed = await composeNFTDetail(nftDetail, msg, colName, colImage)

  return {
    embeds: [embed],
    components: [
      ...getPaginationRow(page, totalPage),
      selectCollectionComponent(
        userNftCollections.map((collection) => ({
          name: collection.name,
          collectionAddress: collection.collection_address,
          default:
            collection.collection_address ===
            currentSelectedCollection.collection_address,
        }))
      ),
      selectOtherViewComponent("nft"),
    ],
  }
}

async function getCurrentViewEmbed(params: {
  msg: Message
  user: User
  currentView: string
  shouldHidePrivateInfo?: boolean
  value?: string
  page?: number
}): Promise<MessageOptions> {
  const { msg, user, currentView, shouldHidePrivateInfo, value, page } = params
  try {
    if (currentView == "nft") {
      return await composeMyNFTEmbed(msg, user, value, page)
    } else {
      return await composeMyProfileEmbed(msg, user, shouldHidePrivateInfo)
    }
  } catch (e) {
    logger.error(e as string)
    return {
      embeds: [getErrorEmbed({ msg })],
      components: [selectOtherViewComponent()],
    }
  }
}

const command: Command = {
  id: "profile",
  command: "profile",
  brief: "Check user's profile",
  category: "Profile",
  run: async (msg) => {
    let currentView = "profile"
    let currentCollection = ""
    const shouldHidePrivateInfo = !hasAdministrator(msg.member)

    // get users
    const users: User[] = []
    const args = getCommandArguments(msg)
    if (args.length > 1) {
      const { isUser, id } = parseDiscordToken(args[1])
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
      users.push(msg.author)
    }

    for (const user of users.values()) {
      const messageOptions = await getCurrentViewEmbed({
        msg,
        user,
        currentView,
        shouldHidePrivateInfo,
      })
      const reply = await msg.reply(messageOptions)

      reply
        .createMessageComponentCollector({
          componentType: MessageComponentTypes.SELECT_MENU,
          idle: 60000,
        })
        .on("collect", async (i) => {
          await i.deferUpdate()
          if (i.customId === "selectView") {
            currentView = i.values[0]
          } else if (i.customId == "selectCollection") {
            currentCollection = i.values[0]
          }

          const messageOptions = await getCurrentViewEmbed({
            msg,
            user,
            currentView,
            value: i.values[0],
            shouldHidePrivateInfo,
          })
          await i.editReply(messageOptions)
        })
        .on("end", async () => {
          await reply.edit({ components: [] })
        })

      listenForPaginateAction(
        reply,
        msg,
        async (msg, page) => {
          return {
            messageOptions: await getCurrentViewEmbed({
              msg,
              user,
              currentView,
              value: currentCollection,
              page,
              shouldHidePrivateInfo,
            }),
          }
        },
        false,
        true
      )
    }

    if (users.length == 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "No profile found",
            }),
          ],
        },
      }
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}profile\n${PREFIX}profile @Mochi Bot`,
          usage: `${PREFIX}profile`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Profile",
}

export default command
