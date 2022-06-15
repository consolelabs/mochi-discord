import { EmbedFieldData, Message } from "discord.js"
import { Command } from "types/common"
import { getAllAliases, getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import add from "./add"
import ticker from "./ticker"
import { getEmojiRarity, getRarityRateFromAttributes } from "utils/rarity"
import community from "adapters/community"

const actions: Record<string, Command> = {
  add,
  ticker,
}
const commands: Record<string, Command> = getAllAliases(actions)

async function composeNFTDetail(
  msg: Message,
  collectionSymbol: string,
  tokenId: string
) {
  const data = await community.getNFTDetail(collectionSymbol, tokenId)
  const {
    name,
    attributes,
    rarity,
  }: { name: string; attributes: any[]; rarity: any } = data
  const title = `${collectionSymbol
    .charAt(0)
    .toUpperCase()}${collectionSymbol.slice(1)}`

  // get rarity rate from list attributes
  let rarityRate = ""
  if (attributes) {
    const rarityCount = new Map<string, number>()
    for (const attr of attributes) {
      const current = rarityCount.get(attr.rarity) ?? 0
      rarityCount.set(attr.rarity, current + 1)
    }
    rarityRate = getRarityRateFromAttributes(rarityCount)
  }

  // set rank, rarity score empty if have data
  let description = name ? `**${name}**` : ""
  if (rarity) {
    const rank = rarity.rank.toString()
    const rarityEmoji = getEmojiRarity(rarityRate)
    description += `\n\n🏆** ・ Rank: ${rank} ・** ${rarityEmoji}`
  }

  const fields: EmbedFieldData[] = attributes
    ? attributes.map((attr) => ({
        name: attr.trait_type,
        value: attr.value,
        inline: true,
      }))
    : []

  // handle image has "ipfs://"
  let { image } = data
  if (image.includes("ipfs://")) {
    const [imagePath] = image.split("ipfs://").slice(1)
    image = `https://ipfs.io/ipfs/${imagePath}`
  }

  const embed = composeEmbedMessage(msg, {
    title,
    description,
    image,
  }).addFields(fields)
  return justifyEmbedFields(embed, 3)
}

const command: Command = {
  id: "nft",
  command: "nft",
  brief: "Check an NFT token info",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg, action) }
    }

    const [symbol, tokenId] = args.slice(1)
    const embed = await composeNFTDetail(msg, symbol, tokenId)

    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  },
  getHelpMessage: async (msg, action) => {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.getHelpMessage(msg)
    }
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft <collection_symbol> <token_id>`,
          examples: `${PREFIX}nft neko 1`,
          footer: [`Type ${PREFIX}help nft <action> for a specific action!`],
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  actions,
}

export default command
