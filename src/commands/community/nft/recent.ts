import { Message } from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import Community from "adapters/community"
import { renderSupportedNFTList } from "utils/canvas"
import { emojis, getEmojiURL } from "utils/common"

async function composeNFTListEmbed(msg: Message, pageIdx: number) {
  const { data, page, size, total } = await Community.getCurrentNFTCollections({
    page: pageIdx,
    size: 16,
  })

  if (!data || !data.length) {
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

  const totalPage = Math.ceil(total / size)
  const embed = composeEmbedMessage(msg, {
    author: ["Newly Supported NFT Collections", getEmojiURL(emojis["SPARKLE"])],
    image: `attachment://nftlist.png`,
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(page, totalPage),
      files: [await renderSupportedNFTList(data)],
    },
  }
}

const command: Command = {
  id: "nft_recent",
  command: "recent",
  brief: "Show list of newly added NFTs",
  category: "Community",
  run: async function (msg: Message) {
    const index = 0
    const msgOpts = await composeNFTListEmbed(msg, index)
    const reply = await msg.reply(msgOpts.messageOptions)

    listenForPaginateAction(reply, msg, composeNFTListEmbed)
    return {
      messageOptions: null,
    }
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
