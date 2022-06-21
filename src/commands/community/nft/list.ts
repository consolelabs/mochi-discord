import { Message } from "discord.js"
import { Command } from "types/common"
import { getEmoji, shortenHashOrAddress } from "utils/common"
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
      time: 30000,
    })
    .on("collect", async (i) => {
      await i.deferUpdate()
      const [pageStr, opStr, totalPage] = i.customId.split("_").slice(1)
      const page = +pageStr + operators[opStr]
      const { embeds } = (await composeNFTListEmbed(msg, page)).messageOptions
      msg.edit({ embeds, components: getPaginationRow(page, +totalPage) })
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
  const { names, symbols, addresses } = data.reduce(
    (acc: any, cur: any) => ({
      names: [...acc.names, `${cur.name}${blank}`],
      symbols: [...acc.symbols, `${cur.symbol}${blank}`],
      addresses: [
        ...acc.addresses,
        `${shortenHashOrAddress(cur.address)}${blank}`,
      ],
    }),
    {
      names: [],
      symbols: [],
      addresses: [],
    }
  )

  const embed = composeEmbedMessage(msg, {
    title: "Supported NFT collections",
  })
    .addField("Name", names.join("\n"), true)
    .addField("Symbol", symbols.join("\n"), true)
    .addField("Address", addresses.join("\n"), true)

  return {
    messageOptions: {
      embeds: [embed],
      components: getPaginationRow(page, Math.ceil(total / size)),
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
}

export default command
