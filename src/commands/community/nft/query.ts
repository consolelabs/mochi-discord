import { EmbedFieldData, Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { DOT, PREFIX } from "utils/constants"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import community from "adapters/community"
import { capitalizeFirst, getEmoji } from "utils/common"

const rarityColors: Record<string, string> = {
  COMMON: "#716757",
  UNCOMMON: "#268f7c",
  RARE: "#3b73b7",
  EPIC: "#8502d6",
  MYTHIC: "#762c90",
  LEGENDARY: "#b08d24",
}

function getRarityEmoji(rarity: string) {
  const rarities = Object.keys(rarityColors)
  rarity = rarities[rarities.indexOf(rarity.toUpperCase())] ?? "common"
  return Array.from(Array(4).keys())
    .map((k) => getEmoji(`${rarity}${k + 1}`))
    .join("")
}

function handleNftError(error: string) {
  if (!error) {
    return null
  }
  switch (error) {
    case "database: record nft collection not found":
      return "Collection has not been added."
    case "indexer: record nft not found":
      return "Token not found."
    case "indexer: data not in sync":
      return "Sync data in progress."
    default:
      return ""
  }
}

async function composeNFTDetail(
  msg: Message,
  collectionSymbol: string,
  tokenId: string
) {
  const res = await community.getNFTDetail(collectionSymbol, tokenId)
  const errorMsg = handleNftError(res.error)
  if (errorMsg) {
    const embed = composeEmbedMessage(msg, {
      title: "NFT",
      description: errorMsg,
    })
    return justifyEmbedFields(embed, 1)
  }

  const { name: colName, image: colImage } =
    await community.getNFTCollectionDetail(collectionSymbol)
  const { name, attributes, rarity, image } = res.data

  // set rank, rarity score empty if have data
  const rarityRate = rarity?.rarity
    ? `**${DOT}** ${getRarityEmoji(rarity.rarity)}`
    : ""
  let description = `**${name ?? ""}**`
  description += rarity?.rank
    ? `\n\n🏆** ・ Rank: ${rarity.rank} ** ${rarityRate}`
    : ""

  const fields: EmbedFieldData[] = attributes
    ? attributes.map((attr: any) => {
        const val = `${attr.value}\n${attr.frequency ?? ""}`
        return {
          name: attr.trait_type,
          value: val ? val : "-",
          inline: true,
        }
      })
    : []

  const embed = composeEmbedMessage(msg, {
    author: [capitalizeFirst(colName), ...(colImage.length ? [colImage] : [])],
    description,
    image,
    color: rarityColors[rarity?.rarity?.toUpperCase()],
  }).addFields(fields)
  return justifyEmbedFields(embed, 3)
}

const command: Command = {
  id: "nftnft_query",
  command: "query",
  brief: "View NFT token info",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const [symbol, tokenId] = args.slice(1)
    return {
      messageOptions: {
        embeds: [await composeNFTDetail(msg, symbol, tokenId)],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft <collection_symbol> <token_id>`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
