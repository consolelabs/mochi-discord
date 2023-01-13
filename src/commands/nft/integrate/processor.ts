import { API_BASE_URL, PT_API_BASE_URL } from "utils/constants"
import fetch from "node-fetch"
import { Message } from "discord.js"
import { getErrorEmbed, getSuccessEmbed } from "discord/embed/ui"
import { InternalError } from "errors"
import { callAPI, toEmbed } from "../processor"

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
