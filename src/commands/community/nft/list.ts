import { Message } from "discord.js"
import { Command } from "types/common"
import { renderSupportedNFTList } from "utils/canvas"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import Community from "adapters/community"
import { emojis, getEmojiURL } from "utils/common"
import { registerFont } from "canvas"

registerFont("src/assets/fonts/whitneysemibold.otf", {
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
  if (!res.data?.data || !res.data.data.length) {
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
    author: ["Supported NFT Collections", getEmojiURL(emojis["HEART"])],
    image: `attachment://nftlist.png`,
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(res.data.metadata?.page || 0, totalPage),
      files: [await renderSupportedNFTList(res.data.data)],
    },
  }
}

const command: Command = {
  id: "nft_list",
  command: "list",
  brief: "Show list of supported NFTs",
  category: "Community",
  run: async function (msg: Message) {
    const msgOpts = await composeNFTListEmbed(msg, 0)
    const reply = await msg.reply(msgOpts.messageOptions)
    listenForPaginateAction(reply, msg, composeNFTListEmbed, true)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
