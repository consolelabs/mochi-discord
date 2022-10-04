import { Message } from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Community from "adapters/community"
import { renderSupportedNFTList } from "utils/canvas"
import { emojis, getEmojiURL } from "utils/common"

async function composeNFTListEmbed(msg: Message, pageIdx: number) {
  const { data } = await Community.getCurrentNFTCollections({
    page: pageIdx,
    size: 16,
  })

  if (!data || !Array.isArray(data.data) || data.data.length === 0) {
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

  const embed = composeEmbedMessage(msg, {
    author: ["Newly Supported NFT Collections", getEmojiURL(emojis["SPARKLE"])],
    image: `attachment://nftlist.png`,
  })

  return {
    messageOptions: {
      embeds: [embed],
      files: [await renderSupportedNFTList(data.data)],
    },
  }
}

const command: Command = {
  id: "nft_recent",
  command: "recent",
  brief: "Show list of newly added NFTs",
  category: "Community",
  run: async function (msg: Message) {
    const msgOpts = await composeNFTListEmbed(msg, 0)
    return msgOpts
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft recent`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
