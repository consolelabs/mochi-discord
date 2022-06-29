import { Message } from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getPaginationRow,
} from "utils/discordEmbed"
import Community from "adapters/community"
import { MessageComponentTypes } from "discord.js/typings/enums"

async function handlePagination(replyMsg: Message, originalMsg: Message) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }
  replyMsg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
    })
    .on("collect", async (i) => {
      await i.deferUpdate()
      const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
      const page = +pageStr + operators[opStr]
      const {
        messageOptions: { embeds },
      } = await composeNFTListEmbed(originalMsg, page)
      await replyMsg.edit({
        embeds,
        components: getPaginationRow(page, +totalPage),
      })
    })
    .on("end", () => {
      replyMsg.edit({ components: [] })
    })
}

async function composeNFTListEmbed(msg: Message, pageIdx: number) {
  const data = await Community.getCurrentNFTCollections({
    page: pageIdx,
  })
  if (!data.data || !data.data.length) {
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

  const { names, symbols, chains } = data.data.reduce(
    (acc: any, cur: any, i: number) => ({
      names: [...acc.names, `#${++i + data.page * data.size}. ${cur.name}`],
      symbols: [...acc.symbols, `${cur.symbol}`],
      chains: [...acc.chains, `${cur.chain}`],
    }),
    {
      names: [],
      symbols: [],
      chains: [],
    }
  )

  const totalPage = Math.ceil(data.total / data.size)
  const embed = composeEmbedMessage(msg, {
    title: "Newly Supported NFT collections",
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })
    .addField("Name", `${names.join("\n")}\n\u200B`, true)
    .addField("Symbol", `${symbols.join("\n")}\n\u200B`, true)
    .addField("Chain", chains.join("\n"), true)

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(data.page, totalPage),
    },
  }
}

const command: Command = {
  id: "nft_newlisted",
  command: "newListed",
  brief: "Show list of current added NFTs",
  category: "Community",
  run: async function (msg: Message) {
    const msgOpts = await composeNFTListEmbed(msg, 0)
    const reply = await msg.reply(msgOpts.messageOptions)
    await handlePagination(reply, msg)
    return {
      messageOptions: null,
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft newListed`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Market",
}

export default command
