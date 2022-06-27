import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

async function executeNftAddCommand(args: string[], msg: Message) {
  const address = args[2]
  const chainId = args[3]
  // create store collection payload
  const collection = {
    chain_id: chainId,
    address: address,
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

  // get response and show discord message
  const dataCollection = await respCollection.json()
  const errorMessageCollection = dataCollection.error
  const dataChain = await respChain.json()
  switch (respCollection.status) {
    case 400:
      return buildDiscordMessage(
        msg,
        "NFT",
        "Already added. Nft is in sync progress"
      )
    case 200:
      return buildDiscordMessage(msg, "NFT", "Successfully add new collection")
    default:
      if (errorMessageCollection.includes("chain is not supported/invalid")) {
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
      }
  }
}

const buildDiscordMessage = (
  msg: Message,
  title: string,
  description: string
) => {
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

    if (args.length < 4 && args.length >= 2) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    return executeNftAddCommand(args, msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft add <address> <chain_id>`,
          examples: `${PREFIX}nft add 0xabcd 1`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
