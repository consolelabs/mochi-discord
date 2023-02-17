import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import Community from "adapters/community"
import { getEmoji } from "utils/common"
import { renderSupportedNFTList } from "../processor"

export async function composeNFTListEmbed(pageIdx: number) {
  const { data } = await Community.getCurrentNFTCollections({
    page: pageIdx,
    size: 16,
  })

  if (!data || !Array.isArray(data.data) || data.data.length === 0) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "No collections recently added",
            description: `${getEmoji(
              "POINTINGRIGHT"
            )} Run \`$nft add\` to add a new NFT collection!`,
          }),
        ],
      },
    }
  }

  const embed = composeEmbedMessage(null, {
    author: ["Newly Supported NFT Collections", getEmoji("DASHBOARD")],
    image: `attachment://nftlist.png`,
  })

  return {
    messageOptions: {
      embeds: [embed],
      files: [await renderSupportedNFTList(data.data)],
    },
  }
}
