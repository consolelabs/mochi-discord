import community from "adapters/community"
import { Message } from "discord.js"
import { InternalError } from "errors"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { callAPI, toEmbed } from "../processor"

export async function executeNftIntegrateCommand(
  address: string,
  chainId: string,
  authorId: string,
  guildId: string,
  msg: Message | undefined
) {
  // check existed collection address - chainId
  const { status, data } = await community.getNftCollectionInfo({
    address,
    chainId,
  })

  if (status !== 200) {
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

  if (!data) {
    throw new InternalError({
      message: msg,
      title: "Can't find the NFT collection",
      description: `The NFT Address and NFT Chain must be valid. Go to the collection's official website/marketplace to find this information.\n${getEmoji(
        "POINTINGRIGHT"
      )} **Marketplace Examples:** [Opensea](http://Opensea.io), [Nftkey](https://nftkey.app/), [Paintswap](https://paintswap.finance/)`,
    })
  }

  const { status: supportVerseStatus = 0, error } =
    await community.updateSupportVerse(address)
  if (supportVerseStatus === 200) {
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: `${data.symbol} integrated`,
            description: `${data.name} collection is now ready to take part in our verse (added + enabled)`,
            image: data.image,
          }),
        ],
      },
    }
  } else {
    let description
    if ([400, 500].includes(supportVerseStatus)) {
      if (supportVerseStatus === 500) {
        description = "Internal Server Error"
      } else {
        description = error ?? ""
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
