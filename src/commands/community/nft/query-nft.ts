import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getEmojiRarity, getRarityRateFromAttributes } from "utils/rarity"
import { buildDiscordMessage } from "./index"
export async function executeNftCollection(args: any[], msg: any) {
  const symbolCollection = args[1]
  const tokenId = args[2]
  // get data nft from server
  const respGetNft = await fetch(
    `${API_BASE_URL}/nfts/${symbolCollection}/${tokenId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
  const dataGetNft = await respGetNft.json()
  const errorMessageGetNft = dataGetNft.error

  // handle case to show discord message
  switch (respGetNft.status) {
    case 200: {
      // get name and attribute
      const name = dataGetNft.data.name
      const attributes = dataGetNft.data.attributes
      let header = `**${name}**`
      if (name == "") {
        header = ""
      }
      // init embed message
      const titleRaw = args[1]
      const title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1)
      const respEmbed = composeEmbedMessage(msg, {
        title: title,
        description: header
      })
      // get rarity rate from list attributes
      let rarityRate = ""
      if (attributes != null) {
        let rarityCount = new Map<string, number>()
        for (const attr of attributes) {
          const current =
            rarityCount.get(attr.rarity) == null
              ? 0
              : rarityCount.get(attr.rarity)
          rarityCount.set(attr.rarity, current + 1)
        }
        rarityRate = getRarityRateFromAttributes(rarityCount)
      }
      // set rank, rarity score empty if have data
      if (dataGetNft.data.rarity != null) {
        const rank = dataGetNft.data.rarity.rank.toString()
        const rarityEmoji = getEmojiRarity(rarityRate)
        respEmbed.description =
          respEmbed.description +
          `\n\n🏆** ・ Rank: ${rank} ・** ${rarityEmoji}`
      }
      // loop through list of attributs to add field to embed message
      if (attributes != null) {
        for (const attr of attributes) {
          const trait_type = attr.trait_type
          const value = attr.value
          respEmbed.addField(trait_type, value, true)
        }
        respEmbed.addField("\u200B", "\u200B", true)
      }
      // handle image has "ipfs://"
      let image = dataGetNft.data.image
      if (image.includes("ipfs://")) {
        const splittedImage = image.split("ipfs://")
        image = "https://ipfs.io/ipfs/" + splittedImage[1]
      }
      respEmbed.setImage(image)
      return {
        messageOptions: {
          embeds: [respEmbed],
          components: []
        }
      }
    }
    default: {
      if (errorMessageGetNft.includes("record not found")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Symbol collection not supported"
        )
      }

      return buildDiscordMessage(
        msg,
        "NFT",
        "Something went wrong, unknown error !!!"
      )
    }
  }
}
