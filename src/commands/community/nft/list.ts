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

async function handlePagination(msg: Message) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }
  msg
    .createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 30000,
    })
    .on("collect", async (i) => {
      await i.deferUpdate()
      const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
      const page = +pageStr + operators[opStr]
      const { embeds } = (await composeNFTListEmbed(msg, page)).messageOptions
      await msg.edit({
        embeds,
        components: getPaginationRow(page, +totalPage),
      })
    })
    .on("end", () => {
      msg.edit({ components: [] })
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
  const { nrs, names, chains } = data.reduce(
    (acc: any, cur: any, i: number) => ({
      nrs: [...acc.nrs, `#${++i}${blank}`],
      names: [...acc.names, `${cur.name}${blank}`],
      chains: [...acc.chains, ...(cur.chain ? [`${cur.chain.name}`] : ["N/A"])],
    }),
    {
      nrs: [],
      names: [],
      chains: [],
    }
  )

  const totalPage = Math.ceil(total / size)
  const embed = composeEmbedMessage(msg, {
    title: "Supported NFT collections",
    footer: [`Page ${pageIdx + 1} / ${totalPage}`],
  })
    .addField("No.", nrs.join("\n"), true)
    .addField("Name", `${names.join("\n")}\n\u200B`, true)
    .addField("Chain", chains.join("\n"), true)

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
    const message = await msg.reply(msgOpts.messageOptions)
    message.author = msg.author
    await handlePagination(message)
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
