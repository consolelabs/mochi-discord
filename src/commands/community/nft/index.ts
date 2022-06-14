import { EmbedFieldData, Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { getAllAliases, getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import add from "./add"
import { getEmojiRarity, getRarityRateFromAttributes } from "utils/rarity"
import community from "adapters/community"
import { shortenHashOrAddress } from "utils/common"
import { renderChartImage } from "utils/canvas"

const actions: Record<string, Command> = {
  add,
}
const commands: Record<string, Command> = getAllAliases(actions)

async function composeCollectionInfo(msg: Message, symbol: string, data: any) {
  const { floor_price, name, contract_address, chain, platforms = [] } = data
  const fields = [
    {
      name: "Name",
      value: name,
    },
    {
      name: "Symbol",
      value: symbol.toUpperCase(),
    },
    {
      name: "Contract",
      value: shortenHashOrAddress(contract_address),
    },
    {
      name: "Chain",
      value: chain,
    },
    {
      name: "Platforms",
      value: platforms.join(", "),
    },
    {
      name: "Floor Price",
      value: `$${floor_price.toLocaleString()}`,
    },
  ].map((f: EmbedFieldData) => ({
    ...f,
    inline: true,
  }))

  const embed = composeEmbedMessage(msg, {
    title: "NFT Collection",
    image: "attachment://chart.png",
  }).addFields(fields)
  return justifyEmbedFields(embed, 3)
}

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
  brief: "Check an NFT info",
  category: "Community",
  run: async function (msg, action) {
    const actionObj = commands[action]
    if (actionObj) {
      return actionObj.run(msg)
    }

    const args = getCommandArguments(msg)
    const [symbol, tokenId] = args.slice(1)
    let embed
    const files = []
    switch (args.length) {
      case 2: {
        const data = await community.getNFTCollectionTickers(symbol)
        const { prices, times } = data.tickers
        embed = await composeCollectionInfo(msg, symbol, data)
        const chart = await renderChartImage({
          chartLabel: "Floor price (USD)",
          labels: times,
          data: prices,
        })
        files.push(new MessageAttachment(chart, "chart.png"))
        break
      }
      case 3:
        embed = await composeNFTDetail(msg, symbol, tokenId)
        break
      default:
        embed = (await this.getHelpMessage(msg)).embeds[0]
    }

    return {
      messageOptions: {
        embeds: [embed],
        files,
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
