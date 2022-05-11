import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
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
      if (args.length < 3) {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
      let symbolCollection = args[1]
      let tokenId = args[2]
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
          var rank = data.data.metadata.rarity.rank.toString()
          var total = data.data.metadata.rarity.total
          var score = data.data.metadata.rarity.score.toString()
          // set rank, rarity score empty if dont have data
          var rarity = `**Rank: ${rank}/${total}**\nRarity Score: ${score}`
          if (rank == "" && total == "" && score == "") {
            rarity = ""
          }
          // init embed message
          var res = header
          var respEmbed = composeEmbedMessage(msg, {
            title: `Cyber Neko`,
            description: res
          }).addFields([
            {
              name: "Rank",
              value: `${rank}/${total}`,
              inline: true
            },
            {
              name: "Rarity Score",
              value: score,
              inline: true
            },
            {
              name: "\u200B",
              value: "\u200B",
              inline: true,
            },
          ])
          // delete 2 last atrribute to get only 9 => more beautiful UI
          // var attrs = attributes.slice(0, (attributes.length - 2))
          // loop through list of attributs to add field to embed message
          for (const attr of attributes) {
            const trait_type = attr.trait_type
            const value = attr.value
            respEmbed.addField(trait_type, value, true)
          }
          respEmbed.addField("\u200B", "\u200B", true)
          respEmbed.setImage(data.data.metadata.image)
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
          console.log(data)
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
    },
    getHelpMessage: async msg => ({
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft <symbol_collection> <token_id>`,
          footer: [`Type ${PREFIX}help nft`],
          examples: `${PREFIX}nft neko 1`
        })
      ]
    }),
    canRunWithoutAction: true
}

export default command
