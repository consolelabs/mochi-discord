import { EmbedFieldData } from "discord.js"
import { Command } from "types/common"
import { getAllAliases, getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import add from "./add"
import { getEmojiRarity, getRarityRateFromAttributes } from "utils/rarity"
import community from "adapters/community"

const actions: Record<string, Command> = {
  add,
}
const commands: Record<string, Command> = getAllAliases(actions)

const command: Command = {
  id: "nft",
  command: "nft",
  brief: "Check an NFT info",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    if (args.length < 3) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }

    const [collectionSymbol, tokenId] = args.slice(1)
    const data = await community.getNFTDetail(collectionSymbol, tokenId)
    const {
      name,
      attributes,
      rarity,
    }: { name: string; attributes: any[]; rarity: any } = data
    const title =
      collectionSymbol.charAt(0).toUpperCase() + collectionSymbol.slice(1)
    let description = name ? `**${name}**` : ""

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

    return {
      messageOptions: {
        embeds: [justifyEmbedFields(embed, 3)],
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
          usage: `${PREFIX}nft <symbol_collection> <token_id>`,
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
