import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { getEmoji } from "utils/common"
import {
  composeEmbedMessage
} from "utils/discordEmbed"

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

      let address = args[2]
      let chain = args[3]
      // add new chain to database
      const collection = {
        chain: chain,
        address: address
      }
      const resp = await fetch(`${API_BASE_URL}/nfts/collection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(collection)
        })
      var data
      switch (resp.status) {
        case 200:
          var respEmbed = composeEmbedMessage(msg, {
            title: "NFT",
            description: `Successfully add new collection`
          })
          return {
            messageOptions: {
              embeds: [
                respEmbed
              ],
              components: []
            },
          }
        case 400:
          data = await resp.json()
          var errorMess = data.error
          if (errorMess.includes("chain is not supported/invalid")) {
            const respChain = await fetch(`${API_BASE_URL}/nfts/supported-chains`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json"
                }
              })
            var dataChain = await respChain.json()
            // add list chain to description
            var listChainSupportedPrefix = `List chain supported:\n`
            var listChainSupported = ``
            for (const chainItm of dataChain.data) {
              listChainSupported = listChainSupported + `${chainItm}\n`
            }
            return {
              messageOptions: {
                embeds: [
                  composeEmbedMessage(msg, {
                    title: `NFT`,
                    description: `Chain is not supported. ` + listChainSupportedPrefix + "```\n" + listChainSupported + "```"
                  })
                ],
                components: []
              },
            }
          }
        case 500:
          data = await resp.json()
          var errorMess = data.error
          if (errorMess.includes("duplicate key value violates unique constraint")) {
            return {
              messageOptions: {
                embeds: [
                  composeEmbedMessage(msg, {
                    title: `NFT`,
                    description: `This collection is already added`
                  })
                ],
                components: []
              },
            }
          } else if (errorMess.includes("No metadata found")) {
            return {
              messageOptions: {
                embeds: [
                  composeEmbedMessage(msg, {
                    title: `NFT`,
                    description: `Cannot found metadata for this collection`
                  })
                ],
                components: []
              },
            }
          }
        default:
          return {
            messageOptions: {
              embeds: [
                composeEmbedMessage(msg, {
                  color: '#FF0000',
                  title: `NFT`,
                  description: `Something went wrong, unknow error !!!`
                })
              ],
              components: []
            }
          }
      }
    } else {
      // currently run $nft neko 1 command, needs refactor
      if (args.length < 3) {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
      let symbolCollection = args[1]
      let tokenId = args[2]

      /////////////////////////////
      if (symbolCollection == "rabby") {

        let tokenId = args[2]
        const resp1 = await fetch(`https://backend.pod.so/api/v1/nft/0x7D1070fdbF0eF8752a9627a79b00221b53F231fA/items/${tokenId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          })

        let dataRabby = await resp1.json()
        let rabbyName = dataRabby.name
        let attributes = dataRabby.attributes

        let header = `**${rabbyName}**`
        if (rabbyName == "") {
          header = ``
        }
        // init embed message
        let res = header
        let titleRaw = args[1]
        let title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1)
        let respEmbed = composeEmbedMessage(msg, {
          title: title,
          description: res
        })
        var rarityRate = dataRabby.rarity.rarity
        // loop through list of attributs to add field to embed message
        if (attributes != null) {
          for (const attr of attributes) {
            const trait_type = attr.trait_type
            const value = attr.value
            respEmbed.addField(trait_type, value, true)
          }
          rarityRate = highestTraitAttr.rarity
          respEmbed.addField("\u200B", "\u200B", true)
        }
        // set rank, rarity score empty if have data
        if (dataRabby.rarity != null) {
          var rank = dataRabby.rarity.rank
          var rarityEmoji = ""
          switch (rarityRate) {
            case "common":
              rarityEmoji = getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")
              break
            case "rare":
              rarityEmoji = getEmoji("RARE1") + getEmoji("RARE2") + getEmoji("RARE3")
              break
            case "uncommon":
              rarityEmoji = getEmoji("UNCOMMON1") + getEmoji("UNCOMMON2") + getEmoji("UNCOMMON3")
              break
            case "legendary":
              rarityEmoji = getEmoji("LEGENDARY1") + getEmoji("LEGENDARY2") + getEmoji("LEGENDARY3")
              break
            case "mythic":
              rarityEmoji = getEmoji("MYTHIC1") + getEmoji("MYTHIC2") + getEmoji("MYTHIC3")
              break
            default:
              rarityEmoji = getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")
              break
          }
          respEmbed.description = respEmbed.description + `\n\n🏆** ・ Rank: ${rank} ・** ${rarityEmoji}`
        }

        respEmbed.setImage(dataRabby.image)
        return {
          messageOptions: {
            embeds: [
              respEmbed
            ],
            components: []
          },
        }
      }
      ///////////////////////////////
      // get data nft from server
      const resp = await fetch(`${API_BASE_URL}/nfts/${symbolCollection}/${tokenId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        })

      // check case
      var data
      switch (resp.status) {
        case 200:
          data = await resp.json()
          // length of attribute
          var name = data.data.metadata.name
          var attributes = data.data.metadata.attributes
          // get data rarity and name
          var header = `**${name}**`
          if (name == "") {
            header = ``
          }
          // init embed message
          var res = header
          var titleRaw = args[1]
          var title = titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1)
          var respEmbed = composeEmbedMessage(msg, {
            title: title,
            description: res
          })
          var rarityRate = ""
          // loop through list of attributs to add field to embed message
          if (data.data.metadata.attributes != null) {
            for (const attr of attributes) {
              const trait_type = attr.trait_type
              const value = attr.value
              respEmbed.addField(trait_type, value, true)
            }
            // get rarity rate from list attributes
            var highestTraitAttr = attributes.reduce(function (prev: typeof attributes[1], curr: typeof attributes[1]) {
              return prev.count < curr.count ? prev : curr;
            });
            rarityRate = highestTraitAttr.rarity
            respEmbed.addField("\u200B", "\u200B", true)
          }
          // set rank, rarity score empty if have data
          if (data.data.metadata.rarity != null) {
            var rank = data.data.metadata.rarity.rank.toString()
            var rarityEmoji = ""
            switch (rarityRate) {
              case "Common":
                rarityEmoji = getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")
                break
              case "Rare":
                rarityEmoji = getEmoji("RARE1") + getEmoji("RARE2") + getEmoji("RARE3")
                break
              case "Uncommon":
                rarityEmoji = getEmoji("UNCOMMON1") + getEmoji("UNCOMMON2") + getEmoji("UNCOMMON3")
                break
              case "Legendary":
                rarityEmoji = getEmoji("LEGENDARY1") + getEmoji("LEGENDARY2") + getEmoji("LEGENDARY3")
                break
              case "Mythic":
                rarityEmoji = getEmoji("MYTHIC1") + getEmoji("MYTHIC2") + getEmoji("MYTHIC3")
                break
              default:
                rarityEmoji = getEmoji("COMMON1") + getEmoji("COMMON2") + getEmoji("COMMON3")
                break
            }
            respEmbed.description = respEmbed.description + `\n\n🏆** ・ Rank: ${rank} ・** ${rarityEmoji}`

            // respEmbed.addFields([
            //   {
            //     name: "Rank",
            //     value: `${rank}/${total}`,
            //     inline: true
            //   },
            //   {
            //     name: "Rarity Score",
            //     value: score,
            //     inline: true
            //   },
            //   {
            //     name: "\u200B",
            //     value: "\u200B",
            //     inline: true,
            //   },
            // ])
          }
          // handle image has "ipfs://"
          let image = data.data.metadata.image
          if (image.includes("ipfs://")) {
            let splittedImage = image.split("ipfs://")
            image = "https://cloudflare-ipfs.com/ipfs/" + splittedImage[1]
          }
          respEmbed.setImage(image)
          return {
            messageOptions: {
              embeds: [
                respEmbed
              ],
              components: []
            },
          }
        case 404:
          return {
            messageOptions: {
              embeds: [
                composeEmbedMessage(msg, {
                  color: '#FF0000',
                  title: `Cyber Neko`,
                  description: `Endpoint not found !!!`
                })
              ],
              components: []
            },
          }
        default:
          data = await resp.json()
          var errorMess = data.error
          if (errorMess.includes("record not found")) {
            return {
              messageOptions: {
                embeds: [
                  composeEmbedMessage(msg, {
                    color: '#FF0000',
                    title: `Cyber Neko`,
                    description: `Symbol collection not supported`
                  })
                ],
                components: []
              },
            }
          } else {
            return {
              messageOptions: {
                embeds: [
                  composeEmbedMessage(msg, {
                    color: '#FF0000',
                    title: `Cyber Neko`,
                    description: `Something went wrong, unknow error !!!`
                  })
                ],
                components: []
              },
            }
          }
      }
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
