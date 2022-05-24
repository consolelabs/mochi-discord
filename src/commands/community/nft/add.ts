// import { Command } from "types/common"
// import { getCommandArguments } from "utils/commands"
// import { PREFIX } from "utils/constants"
import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { buildDiscordMessage } from "./index"
// import { composeEmbedMessage } from "utils/discordEmbed"
// import { getEmoji } from "utils/common"

export async function executeNftAddCommand(args: any[], msg: any) {
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
