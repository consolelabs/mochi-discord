import { ADD_COLLECTION_GITBOOK, API_BASE_URL } from "utils/constants"
import fetch, { Response } from "node-fetch"
import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { SplitMarketplaceLink, CheckMarketplaceLink } from "utils/marketplace"
import { InternalError } from "errors"

export async function callAPI(
  address: string,
  chainId: string,
  userId: string,
  guildId: string,
  msg: Message | undefined,
  priorityFlag: boolean
) {
  // create store collection payload
  const collection = {
    chain_id: chainId,
    address: address,
    author: userId,
    guild_id: guildId,
    message_id: msg?.id,
    channel_id: msg?.channelId,
    priority_flag: priorityFlag,
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
  msg?: Message | undefined
) {
  // get response and show discord message
  const dataCollection = await storeCollectionRes.json()
  const error = dataCollection.error
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
        error.includes(
          "Cannot get name and symbol of contract: This collection does not support collection name"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection name."
        )
      } else if (
        error.includes(
          "Cannot get name and symbol of contract: This collection does not support collection symbol"
        )
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection does not support collection symbol."
        )
      } else if (
        error.includes(
          "Cannot get name and symbol of contract: no contract code at given address"
        )
      ) {
        throw new InternalError({
          message: msg,
          title: "Can't find the NFT collection",
          description:
            "The NFT Address and NFT Chain must be valid. Go to the collection's official website/ marketplace to find this information. ",
        })
      } else if (error.includes("Already added. Nft is in sync progress")) {
        return buildDiscordMessage(
          msg,
          "Existing Collection",
          "Please add another one or view the collection by `$nft <collection_symbol> <token_id>`."
        )
      } else if (error.includes("block number not synced yet")) {
        return buildDiscordMessage(msg, "NFT", "Block number is not in sync.")
      } else if (error.includes("Already added. Nft is done with sync")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Already added. Nft is done with sync"
        )
      } else if (error.includes("chain is not supported/invalid")) {
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
        error.includes("duplicate key value violates unique constraint")
      ) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "This collection is already added"
        )
      } else if (error.includes("No metadata found")) {
        return buildDiscordMessage(
          msg,
          "NFT",
          "Cannot found metadata for this collection"
        )
      } else {
        return buildDiscordMessage(msg, "NFT", error)
      }
  }
}

export async function executeNftAddCommand(args: string[], msg: Message) {
  const { storeCollectionRes, supportedChainsRes } = await callAPI(
    args[2],
    args[3],
    msg.author.id,
    msg.guildId ?? "",
    msg,
    args[4] === "priority"
  )

  return toEmbed(storeCollectionRes, supportedChainsRes, msg)
}

const buildDiscordMessage = (
  msg: Message | undefined,
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
          usage: `To add a collection on EVM chain (ETH and FTM), use:\n${PREFIX}nft add <address> <chain_id/chain_symbol>\n\nTo add a collection on Solana:\n$nft add <collection_id> <chain_id/chain_symbol>`,
          examples: `${PREFIX}nft add 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm\n${PREFIX}mochi add 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 5\n${PREFIX}nft add https://opensea.io/collection/tykes`,
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
