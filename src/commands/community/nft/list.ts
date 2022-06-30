import { Message } from "discord.js"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
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
  const { data, page, size, total } = await Community.getNFTCollections({
    page: pageIdx,
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

  const blank = getEmoji("blank")
  const { names, symbols } = data.reduce(
    (acc: any, cur: any, i: number) => ({
      names: [
        ...acc.names,
        `#${++i + page * size}. ${cur.name} ${getEmoji(
          cur.chain?.currency ?? ""
        )}${blank}`,
      ],
      symbols: [...acc.symbols, `${cur.symbol}${blank}`],
      // chains: [...acc.chains, cur.chain?.name ?? "TBD"],
    }),
    {
      names: [],
      symbols: [],
      // chains: [],
    }
  )

  const totalPage = Math.ceil(total / size)
  const embed = composeEmbedMessage(msg, {
    title: "Supported NFT collections",
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })
    .addField("Name", `${names.join("\n")}\n\u200B`, true)
    .addField("Ticker", `${symbols.join("\n")}`, true)
    .addField(
      "Details",
      Array(names.length).fill(`[View](https://getmochi.co)`).join("\n"),
      true
    )
  // .addField("Chain", chains.join("\n"), true)

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(page, totalPage),
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
    await handlePagination(reply, msg)
    return {
      messageOptions: null,
    }
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
