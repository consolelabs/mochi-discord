import profile from "adapters/profile"
import {
  Message,
  MessageActionRow,
  MessageSelectMenu,
  MessageOptions,
  MessageSelectOptionData,
} from "discord.js"
import { Command } from "types/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { PREFIX } from "utils/constants"
import { getEmoji } from "utils/common"
import { MessageComponentTypes } from "discord.js/typings/enums"
import { logger } from "logger"
import { composeNFTDetail } from "commands/community/nft/query"
import community from "adapters/community"

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
    getEmoji("BAR_1_EMPTY"),
    getEmoji("BAR_2_EMPTY"),
    getEmoji("BAR_2_EMPTY"),
    getEmoji("BAR_2_EMPTY"),
    getEmoji("BAR_2_EMPTY"),
    getEmoji("BAR_3_EMPTY"),
  ]
  const maxBar = 6
  const progressOutOfMaxBar = Math.round(progress * maxBar)
  for (let i = 0; i <= progressOutOfMaxBar; ++i) {
    if (progressOutOfMaxBar == 0) break
    let barEmote = "BAR_2_FULL"
    if (i == 1) {
      barEmote = i == progressOutOfMaxBar ? "BAR_1_MID" : "BAR_1_FULL"
    } else if (i > 1 && i < maxBar) {
      barEmote = i == progressOutOfMaxBar ? "BAR_2_MID" : "BAR_2_FULL"
    } else {
      barEmote = i == progressOutOfMaxBar ? "BAR_3_MID" : "BAR_3_FULL"
    }
    progressBar[i - 1] = getEmoji(barEmote, true)
  }
  return progressBar.join("")
}

async function composeMyProfileEmbed(msg: Message): Promise<MessageOptions> {
  const userProfile = await profile.getUserProfile(
    msg.guildId ?? "",
    msg.author.id
  )
  const aboutMeStr =
    userProfile.about_me.trim().length === 0
      ? "I'm a mysterious person"
      : userProfile.about_me

  let addressStr = userProfile.user_wallet?.address
  if (!addressStr || !addressStr.length) {
    addressStr = "N/A"
  }

  const lvlStr = `\`${userProfile.current_level.level}\``
  const lvlMax = 60
  const levelProgress = buildProgressbar(
    userProfile.current_level.level / lvlMax
  )
  const nextLevelMinXp = userProfile.next_level.min_xp
    ? userProfile.next_level.min_xp
    : userProfile.current_level.min_xp

  const xpProgress = buildProgressbar(userProfile.guild_xp / nextLevelMinXp)

  const xpStr = `\`${userProfile.guild_xp}/${
    userProfile.next_level.min_xp
      ? userProfile.next_level.min_xp
      : userProfile.current_level.min_xp
  }\``

  const walletValue = "Wallet: `NA`"
  const protocolValue = "Protocol: `NA`"
  const nftValue = "NFT: `NA`"
  const assetsStr = `${walletValue}\n${protocolValue}\n${nftValue}`
  const highestRole =
    msg.member?.roles.highest.name !== "@everyone"
      ? msg.member?.roles.highest
      : null

  const roleStr = `\`${highestRole?.name ?? "N/A"}\``
  const activityStr = `${getEmoji("FLAG")} \`${userProfile.nr_of_actions}\``
  const rankStr = `:trophy: \`${userProfile.guild_rank ?? 0}\``

  const embed = composeEmbedMessage(msg, {
    thumbnail: msg.author.displayAvatarURL(),
    author: [`${msg.author.username}'s profile`, msg.author.displayAvatarURL()],
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
    { name: "About me", value: aboutMeStr },
    { name: "Address", value: addressStr },
    { name: "Role", value: roleStr, inline: true },
    { name: "Activities", value: activityStr, inline: true },
    { name: "Rank", value: rankStr, inline: true }
  )

  return {
    embeds: [embed],
    components: [selectOtherViewComponent("profile")],
  }
}

async function composeMyNFTEmbed(
  msg: Message,
  collectionAddress?: string,
  page = 0
): Promise<MessageOptions> {
  const userProfile = await profile.getUserProfile(
    msg.guildId ?? "",
    msg.author.id
  )
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
          description: `Your account doesn't have a wallet associated.\n${verifyCTA}`,
        }),
      ],
    }
  }

  const { data: userNftCollections } = await profile.getUserNFTCollection({
    userAddress,
  })

  if (userNftCollections.length === 0) {
    const embed = composeEmbedMessage(msg, {
      author: [
        `${msg.author.username}'s NFT collection`,
        msg.author.displayAvatarURL(),
      ],
      description: `<@${msg.author.id}>, you have no nfts.`,
    })
    return { embeds: [embed], components: [selectOtherViewComponent()] }
  }

  const currentSelectedCollection =
    userNftCollections.find(
      (collection) => collection.collection_address === collectionAddress
    ) ?? userNftCollections[0]

  const { name: colName, image: colImage } = currentSelectedCollection
  const pageSize = 1

  const { total: userNftsTotal, data: userNfts } = await profile.getUserNFT({
    userAddress,
    collectionAddress: currentSelectedCollection.collection_address,
    page: page,
    size: pageSize,
  })
  const totalPage = Math.ceil(userNftsTotal / pageSize)

  if (userNfts.length === 0) {
    const embed = composeEmbedMessage(msg, {
      author: [
        `${msg.author.username}'s NFT collection`,
        msg.author.displayAvatarURL(),
      ],
      description: `<@${msg.author.id}>, you have no nfts.`,
    })
    return { embeds: [embed], components: [selectOtherViewComponent()] }
  }

  const userNft = userNfts[0]
  const nftDetail = await profile.getNFTDetails({
    collectionAddress: userNft.collection_address,
    tokenId: userNft.token_id,
  })
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
  currentView: string
  value?: string
  page?: number
}): Promise<MessageOptions> {
  const { msg, currentView, value, page } = params
  try {
    if (currentView == "nft") {
      return await composeMyNFTEmbed(msg, value, page)
    } else {
      return await composeMyProfileEmbed(msg)
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
  brief: "Check your server profile",
  category: "Profile",
  run: async (msg) => {
    let currentView = "profile"
    let currentCollection = ""

    const messageOptions = await getCurrentViewEmbed({ msg, currentView })
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
          currentView,
          value: i.values[0],
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
            currentView,
            value: currentCollection,
            page,
          }),
        }
      },
      false,
      true
    )

    return null
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}profile`,
          usage: `${PREFIX}profile`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Profile",
}

export default command
