import { API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { SplitMarketplaceLink, CheckMarketplaceLink } from "utils/marketplace"
import { executeNftAddCommand } from "../nft/add"

async function executeNftIntergrateCommand(args: string[], msg: Message) {
  const address = args[2]
  const chainId = args[3]
  // check existed collection address - chainId
  const respCollection = await fetch(
    `${API_BASE_URL}/nfts/collections/address/${address}?chain=${chainId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  // get response and show discord message
  switch (respCollection.status) {
    case 200:
      return buildDiscordMessage(
        msg,
        "NFT",
        "Already existed, finish intergrate",
        false
      )
    default:
      executeNftAddCommand(args, msg)
  }
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
  id: "intergrate_nft",
  command: "intergrate",
  brief: "Intergrate an NFT collection",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    // case add markeplacelink
    // $nft intergrate https://opensea.io/collection/cryptodickbutts-s3
    if (args.length == 3) {
      if (CheckMarketplaceLink(args[2])) {
        const platform = SplitMarketplaceLink(args[2])
        args.push(platform)
      } else {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
    }
    return executeNftIntergrateCommand(args, msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}nft intergrate <address> <chain_id>`,
          examples: `${PREFIX}nft intergrate 0xabcd 1`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
