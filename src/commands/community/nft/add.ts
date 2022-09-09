import { ADD_COLLECTION_GITBOOK, API_BASE_URL } from "utils/constants"
import fetch, { Response } from "node-fetch"
import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { SplitMarketplaceLink, CheckMarketplaceLink } from "utils/marketplace"

export async function callAPI(args: string[], msg: Message) {
  const address = args[2]
  const chainId = args[3]
  // create store collection payload
  const collection = {
    chain_id: chainId,
    address: address,
    author: msg.author.id,
    guild_id: msg.guild?.id,
  }
  // run store collection API
  const respCollection = await fetch(`${API_BASE_URL}/nfts/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collection),
  })
  // get supported chain
  const respChain = await fetch(`${API_BASE_URL}/nfts/supported-chains`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  return { storeCollectionRes: respCollection, supportedChainsRes: respChain }
}

export async function toEmbed(
  storeCollectionRes: Response,
  supportedChainsRes: Response,
  msg: Message
) {
  // get response and show discord message
  const dataCollection = await storeCollectionRes.json()
  const errorMessageCollection = dataCollection.error
  const dataChain = await supportedChainsRes.json()
  switch (storeCollectionRes.status) {
    case 200:
      return buildDiscordMessage(
        msg,
        "NFT",
        "Successfully add new collection to queue",
        false
      )
    case 500:
      return buildDiscordMessage(msg, "NFT", "Internal Server Error")
    default:
      if (
        errorMessageCollection.includes(
          "Cannot get name and symbol of contract: This collection does not support collection name"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection name."
        )
      } else if (
        errorMessageCollection.includes(
          "Cannot get name and symbol of contract: This collection does not support collection symbol"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection symbol."
        )
      } else if (
        errorMessageCollection.includes(
          "Already added. Nft is in sync progress"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Already added. Nft is in sync progress"
        )
      } else if (
        errorMessageCollection.includes("block number not synced yet")
      ) {
        return buildDiscordMessage(msg, "NFT", "Block number is not in sync.")
      } else if (
        errorMessageCollection.includes("Already added. Nft is done with sync")
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Already added. Nft is done with sync"
        )
      } else if (
        errorMessageCollection.includes("chain is not supported/invalid")
      ) {
        // add list chain to description
        const listChainSupportedPrefix = `List chain supported:\n`
        let listChainSupported = ""
        for (const chainItm of dataChain.data) {
          listChainSupported = listChainSupported + `${chainItm}\n`
        }
        const listChainDescription =
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
      } else {
        return buildDiscordMessage(msg, "NFT", errorMessageCollection)
      }
  }
}

async function executeNftAddCommand(args: string[], msg: Message) {
  const { storeCollectionRes, supportedChainsRes } = await callAPI(args, msg)

  return toEmbed(storeCollectionRes, supportedChainsRes, msg)
}

const buildDiscordMessage = (
  msg: Message,
  title: string,
  description: string,
  err = true
) => {
  if (err) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            title: title,
            description: description,
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          title: title,
          description: description,
        }),
      ],
    },
  }
}

const command: Command = {
  id: "add_nft",
  command: "add",
  brief: "Add an NFT collection",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    // case add marketplace link
    // $nft add https://opensea.io/collection/cryptodickbutts-s3
    if (args.length == 3) {
      if (CheckMarketplaceLink(args[2])) {
        const platform = SplitMarketplaceLink(args[2])
        args.push(platform)
      } else {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
    }

    return executeNftAddCommand(args, msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft add <address> <chain_id>`,
          examples: `${PREFIX}nft add 0xabcd 1`,
          document: ADD_COLLECTION_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
