import { Message } from "discord.js"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import Community from "adapters/community"
import { emojis, getEmojiURL } from "utils/common"
import { registerFont } from "canvas"
import { getPaginationRow } from "ui/discord/button"
import { renderSupportedNFTList } from "../processor"

registerFont("assets/fonts/whitneysemibold.otf", {
  family: "Whitney",
  weight: "semibold",
})

export async function composeNFTListEmbed(
  msg: Message | undefined,
  pageIdx: number
) {
  const res = await Community.getNFTCollections({
    page: pageIdx,
    size: 16,
  })
  if (!res.data?.data?.length) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            msg,
            description: "No NFT collections found",
          }),
        ],
      },
    }
  }
  const totalPage = Math.ceil(
    (res.data.metadata?.total || 0) / (res.data.metadata?.size || 1)
  )
  const embed = composeEmbedMessage(msg, {
    author: ["NFT collections list", getEmojiURL(emojis.NFTS)],
    description: "To add new collection, run `$nft add <address> <chain_id>`.",
    image: `attachment://nftlist.png`,
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
    color: "#FCD3C1",
  })

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(res.data.metadata?.page || 0, totalPage),
      files: [await renderSupportedNFTList(res.data.data)],
    },
  }
}
