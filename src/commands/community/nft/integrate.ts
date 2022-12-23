import { API_BASE_URL, PT_API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { Message } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { SplitMarketplaceLink, CheckMarketplaceLink } from "utils/marketplace"
import { callAPI, toEmbed } from "../nft/add"
import { InternalError } from "errors"

export async function executeNftIntegrateCommand(
  address: string,
  chainId: string,
  authorId: string,
  guildId: string,
  msg: Message | undefined
) {
  // check existed collection address - chainId
  const checkExistRes = await fetch(
    `${API_BASE_URL}/nfts/collections/address/${address}?chain=${chainId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (checkExistRes.status !== 200) {
    const { storeCollectionRes, supportedChainsRes } = await callAPI(
      address,
      chainId,
      authorId,
      guildId,
      msg,
      false
    )
    // return early if the `add` command didn't succeed
    if (storeCollectionRes.status !== 200) {
      return toEmbed(storeCollectionRes, supportedChainsRes, msg)
    }
  }

  const colDetail = await checkExistRes.json()
  if (!colDetail.data) {
    throw new InternalError({
      message: msg,
      title: "Can't find the NFT collection",
      description: `The NFT Address and NFT Chain must be valid. Go to the collection's official website/marketplace to find this information.\n👉 **Marketplace Examples:** [Opensea](http://Opensea.io), [Nftkey](https://nftkey.app/), [Paintswap](https://paintswap.finance/)`,
    })
  }

  const enableVerseRes = await fetch(
    `${PT_API_BASE_URL}/nft/${address}/support-verse-enable`,
    { method: "PUT" }
  )
  if (enableVerseRes.status === 200) {
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: `${colDetail.data.symbol} integrated`,
            description: `${colDetail.data.name} collection is now ready to take part in our verse (added + enabled)`,
            image: colDetail.data.image,
          }),
        ],
      },
    }
  } else {
    let description
    if ([400, 500].includes(enableVerseRes.status)) {
      if (enableVerseRes.status === 500) {
        description = "Internal Server Error"
      } else {
        description = (await enableVerseRes.json()).error
      }
    }
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            description,
          }),
        ],
      },
    }
  }
}

const command: Command = {
  id: "integrate_nft",
  command: "integrate",
  brief: "Integrate an NFT collection",
  category: "Community",
  run: async function (msg) {
    const args = getCommandArguments(msg)
    // case add marketplace link
    // $nft integrate https://opensea.io/collection/cryptodickbutts-s3
    if (args.length == 3) {
      if (CheckMarketplaceLink(args[2])) {
        const platform = SplitMarketplaceLink(args[2])
        args.push(platform)
      } else {
        return { messageOptions: await this.getHelpMessage(msg) }
      }
    }
    return executeNftIntegrateCommand(
      args[2],
      args[3],
      msg.author.id,
      msg.guildId ?? "",
      msg
    )
  },
  getHelpMessage: async function (msg) {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          title: this.brief,
          usage: `${PREFIX}nft integrate <address> <chain_id>`,
          examples: `${PREFIX}nft integrate 0xFBde54764f51415CB0E00765eA4383bc90EDCCE8 5\n${PREFIX}mochi integrate 0x51081a152db09d3FfF75807329A3A8b538eCf73b ftm`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Market",
  minArguments: 3,
}

export default command
