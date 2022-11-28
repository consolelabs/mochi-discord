import defi from "adapters/defi"
import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageOptions,
} from "discord.js"
import {
  MessageButtonStyles,
  MessageComponentTypes,
} from "discord.js/typings/enums"
import { APIError } from "errors"
import { ModelOffchainTipBotTransferHistory } from "types/api"
import { Command } from "types/common"
import { UserBalances } from "types/defi"
import { getCommandArguments } from "utils/commands"
import { getEmoji, paginate, roundFloatNumber } from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export async function handleStatement(
  args: string,
  authorId: string,
  inflow?: boolean,
  outflow?: boolean
) {
  const bals = await defi.offchainGetUserBalances({
    userId: authorId,
  })
  if (!bals.ok) {
    throw new APIError({ curl: bals.curl, description: bals.log })
  }
  const symbol = args.toUpperCase()
  // get balance and price in usd
  let currentBal = 0
  let currentPrice = 0
  bals.data?.forEach((bal: any) => {
    if (symbol === bal.symbol) {
      currentBal = bal.balances
      currentPrice = bal.rate_in_usd
    }
  })
  const payload = {
    sender_id: authorId,
    receiver_id: authorId,
    token: symbol,
  }
  if (inflow) {
    payload.sender_id = ""
  }
  if (outflow) {
    payload.receiver_id = ""
  }
  const { data, ok, log, curl } = await defi.getTransactionsHistories(payload)
  if (!ok) {
    throw new APIError({ curl, description: log })
  }

  const values = (data as ModelOffchainTipBotTransferHistory[]) ?? []

  let pages = paginate(values, 5)
  pages = pages.map((arr: any, idx: number): MessageEmbed => {
    let col1 = ""
    let col2 = ""
    arr.forEach((item: any) => {
      if (item.action === "withdraw") {
        col1 += `<@!${authorId}>\n${getEmoji("reply")} **${item.action}**\n\n`
        col2 += `**- ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (\u2248 $${roundFloatNumber(currentPrice * item.amount, 4)})\n\n`
        return
      }
      if (item.action === "deposit") {
        col1 += `<@!${authorId}>\n${getEmoji("reply")} **${item.action}**\n\n`
        col2 += `**+ ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (\u2248 $${roundFloatNumber(currentPrice * item.amount, 4)})\n\n`
        return
      }
      if (item.sender_id === authorId) {
        col1 += `<@!${item.receiver_id}>\n${getEmoji("reply")} **${
          item.action
        }**\n\n`
        col2 += `**- ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (\u2248 $${roundFloatNumber(currentPrice * item.amount, 4)})\n\n`
      } else {
        col1 += `<@!${item.sender_id}>\n${getEmoji("reply")} **${
          item.action
        }**\n\n`
        col2 += `**+ ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (\u2248 $${roundFloatNumber(currentPrice * item.amount, 4)})\n\n`
      }
    })
    let des = `**Balance: ${roundFloatNumber(
      currentBal,
      4
    )} ${symbol}** (\u2248 $${roundFloatNumber(currentPrice * currentBal, 4)})`
    if (symbol === "") {
      des = ""
      bals.data?.forEach((balance: UserBalances) => {
        const tokenBalance = roundFloatNumber(balance["balances"] ?? 0, 4)
        if (tokenBalance === 0) return
        const tokenBalanceInUSD = roundFloatNumber(
          balance["balances_in_usd"],
          4
        )

        des += `**${balance["name"]}: ${tokenBalance} ${balance["symbol"]}** (\u2248 $${tokenBalanceInUSD})\n`
      })
    }
    return composeEmbedMessage(null, {
      title: `${getEmoji("STATEMENTS")} Transaction history`,
      footer: [`Page ${idx + 1} / ${pages.length}`],
    })
      .setDescription(des)
      .addFields(
        { name: "User", value: col1, inline: true },
        { name: "Amount", value: col2, inline: true }
      )
  })
  if (!pages.length) {
    return []
  }

  return pages
}

function listenButtonsRow(
  replyMsg: Message,
  originalMsg: Message,
  args: string,
  pages: any,
  render: (
    msg: Message,
    pageIdx: number,
    pages: any
  ) => Promise<{ messageOptions: MessageOptions }>
) {
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
      const [pageStr, opStr] = i.customId.split("_").slice(1)
      let page = +pageStr + operators[opStr]
      if (i.customId.includes("statement_cash")) {
        const [flow] = i.customId.split("_").slice(2)
        const newPages = await handleStatement(
          args,
          originalMsg.author.id,
          flow === "inflow",
          flow === "outflow"
        )
        pages = newPages
        page = 0
      }
      const {
        messageOptions: { embeds, components },
      } = await render(originalMsg, page, pages)

      const msgComponents = components
      await replyMsg
        .edit({
          embeds,
          components: msgComponents,
        })
        .catch(() => null)
    })
    .on("end", () => {
      replyMsg.edit({ components: [] }).catch(() => null)
    })
}

export function buildButtonsRow(page: number, totalPage: number) {
  if (totalPage === 1)
    return [
      new MessageActionRow()
        .addComponents({
          type: MessageComponentTypes.BUTTON,
          style: MessageButtonStyles.PRIMARY,
          label: "Cash inflow",
          customId: `statement_cash_inflow`,
        })
        .addComponents({
          type: MessageComponentTypes.BUTTON,
          style: MessageButtonStyles.PRIMARY,
          label: "Cash outflow",
          customId: `statement_cash_outflow`,
        }),
    ]
  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton({
        type: MessageComponentTypes.BUTTON,
        style: MessageButtonStyles.PRIMARY,
        customId: `page_${page}_-_${totalPage}`,
      }).setEmoji(getEmoji("left_arrow"))
    )
    .addComponents(
      new MessageButton({
        type: MessageComponentTypes.BUTTON,
        style: MessageButtonStyles.PRIMARY,
        customId: `page_${page}_+_${totalPage}`,
      }).setEmoji(getEmoji("right_arrow"))
    )
    .addComponents({
      type: MessageComponentTypes.BUTTON,
      style: MessageButtonStyles.PRIMARY,
      label: "Cash inflow",
      customId: `statement_cash_inflow`,
    })
    .addComponents({
      type: MessageComponentTypes.BUTTON,
      style: MessageButtonStyles.PRIMARY,
      label: "Cash outflow",
      customId: `statement_cash_outflow`,
    })
  if (page === 0) {
    actionRow.components[0].disabled = true
  }

  if (page === totalPage - 1) {
    actionRow.components[1].disabled = true
  }
  return [actionRow]
}

const command: Command = {
  id: "statements",
  command: "statements",
  brief: "List all statement of your wallet",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const token = args.length > 1 ? args[1] : ""
    const pages = await handleStatement(token, msg.author.id)
    if (pages.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: `${getEmoji("STATEMENTS")} Transaction histories`,
              description: `You haven't made any transaction ${
                token !== "" ? `with **${token.toUpperCase()}** yet` : ""
              }. Run ${PREFIX}tip <@username/@role> <amount> <token> to transfer token.`,
            }),
          ],
        },
      }
    }
    const msgOpts = {
      messageOptions: {
        embeds: [pages[0]],
        components: buildButtonsRow(0, pages.length),
      },
    }
    const reply = await msg.reply(msgOpts.messageOptions)
    listenButtonsRow(
      reply,
      msg,
      args[1],
      pages,
      async (_msg: Message, idx: number, pages: any) => {
        return {
          messageOptions: {
            embeds: [pages[idx]],
            components: buildButtonsRow(idx, pages.length),
          },
        }
      }
    )
  },
  featured: {
    title: `${getEmoji("STATEMENTS")} Statements`,
    description: "List all transactions histories of your wallet",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}statements [token]`,
        description: "Show your statements",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${PREFIX}$statement\n{PREFIX}statements ftm`,
      }),
    ],
  }),
  aliases: ["statement"],
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 1,
}

export default command
