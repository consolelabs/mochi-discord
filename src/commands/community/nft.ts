import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getEmoji } from "utils/common"

async function executeNftAddCommand(args: any[], msg: any) {
  var address = args[2]
  var chain = args[3]
  // create store collection payload
  var collection = {
    chain: chain,
    address: address
  }
  // run store collection API
  var respCollection = await fetch(`${API_BASE_URL}/nfts/collection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(collection)
  })
  // get supported chain
  var respChain = await fetch(`${API_BASE_URL}/nfts/supported-chains`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })

  // get response and show discord message
  var dataCollection = await respCollection.json()
  var errorMessageCollection = dataCollection.error
  var dataChain = await respChain.json()
  var errorMessageChain
  switch (respCollection.status) {
    case 200:
      return buildDiscordMessage(msg, "NFT", "Successfully add new collection")
    default:
      if (errorMessageCollection.includes("chain is not supported/invalid")) {
        // add list chain to description
        var listChainSupportedPrefix = `List chain supported:\n`
        var listChainSupported = ``
        for (const chainItm of dataChain.data) {
          listChainSupported = listChainSupported + `${chainItm}\n`
        }
        var listChainDescription =
          `Chain is not supported. ` +
          listChainSupportedPrefix +
          "```\n" +
          listChainSupported +
          "```"
        return buildDiscordMessage(msg, "NFT", listChainDescription)
      } else if (
        errorMessageCollection.includes(
          "duplicate key value violates unique constraint"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection is already added"
        )
      } else if (errorMessageCollection.includes("No metadata found")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Cannot found metadata for this collection"
        )
      }
  }
}

function buildDiscordMessage(msg: any, title: string, description: string) {
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: title,
          description: description
        })
      ],
      components: [] as any[]
    }
  }
}

async function executeNftCollection(args: any[], msg: any) {
  var symbolCollection = args[1]
  var tokenId = args[2]
  // get data nft from server
  var respGetNft = await fetch(
    `${API_BASE_URL}/nfts/${symbolCollection}/${tokenId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
  var dataGetNft = await respGetNft.json()
  var errorMessageGetNft = dataGetNft.error

  // handle case to show discord message
  switch (respGetNft.status) {
    case 200:
      // get name and attribute
      var name = dataGetNft.data.metadata.name
      var attributes = dataGetNft.data.metadata.attributes
      var header = `**${name}**`
      if (name == "") {
        header = ``
      }
      // init embed message
      var titleRaw = args[1]
      var title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1)
      var respEmbed = composeEmbedMessage(msg, {
        title: title,
        description: header
      })
      // get rarity rate from list attributes
      var rarityRate = ""
      var highestTraitAttr = attributes.reduce(function (
        prev: typeof attributes[1],
        curr: typeof attributes[1]
      ) {
        return prev.count < curr.count ? prev : curr
      })
      rarityRate = highestTraitAttr.rarity
      // set rank, rarity score empty if have data
      if (dataGetNft.data.metadata.rarity != null) {
        var rank = dataGetNft.data.metadata.rarity.rank.toString()
        var rarityEmoji = ""
        switch (rarityRate) {
          case "Common":
            rarityEmoji =
              getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")
            break
          case "Rare":
            rarityEmoji =
              getEmoji("RARE1") + getEmoji("RARE2") + getEmoji("RARE3")
            break
          case "Uncommon":
            rarityEmoji =
              getEmoji("UNCOMMON1") +
              getEmoji("UNCOMMON2") +
              getEmoji("UNCOMMON3")
            break
          case "Legendary":
            rarityEmoji =
              getEmoji("LEGENDARY1") +
              getEmoji("LEGENDARY2") +
              getEmoji("LEGENDARY3")
            break
          case "Mythic":
            rarityEmoji =
              getEmoji("MYTHIC1") + getEmoji("MYTHIC2") + getEmoji("MYTHIC3")
            break
          default:
            rarityEmoji =
              getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")
            break
        }
        respEmbed.description =
          respEmbed.description +
          `\n\n🏆** ・ Rank: ${rank} ・** ${rarityEmoji}`
      }
      // loop through list of attributs to add field to embed message
      if (dataGetNft.data.metadata.attributes != null) {
        for (const attr of attributes) {
          const trait_type = attr.trait_type
          const value = attr.value
          respEmbed.addField(trait_type, value, true)
        }
        respEmbed.addField("\u200B", "\u200B", true)
      }
      // handle image has "ipfs://"
      let image = dataGetNft.data.metadata.image
      if (image.includes("ipfs://")) {
        let splittedImage = image.split("ipfs://")
        image = "https://ipfs.io/ipfs/" + splittedImage[1]
      }
      respEmbed.setImage(image)
      return {
        messageOptions: {
          embeds: [respEmbed],
          components: []
        }
      }
    default:
      if (errorMessageGetNft.includes("record not found")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Symbol collection not supported"
        )
      } else {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Something went wrong, unknown error !!!"
        )
      }
  }
}

const command: Command = {
  id: "nft",
  command: "nft",
  brief: "Cyber Neko",
  category: "Community",
  run: async function (msg, action) {
    // get argument from command
    let args = getCommandArguments(msg)
    // run $nft add command
    if (args[1] == "add") {
      if (args.length < 4 && args.length >= 2) {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
      return executeNftAddCommand(args, msg)
    } else {
      // currently run $nft neko 1
      if (args.length < 3) {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
      return executeNftCollection(args, msg)
    }
  },
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft <symbol_collection> <token_id>\n${PREFIX}nft add <address> <chain>`,
        footer: [`Type ${PREFIX}help nft`],
        examples: `${PREFIX}nft neko 1\n${PREFIX}nft add 0xabcd eth`
      })
    ]
  }),
  canRunWithoutAction: true
}

export default command
