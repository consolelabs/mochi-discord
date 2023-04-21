import defi from "adapters/defi"
import {
  CommandInteraction,
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
import { composeEmbedMessage } from "ui/discord/embed"
import {
  authorFilter,
  getEmoji,
  msgColors,
  paginate,
  roundFloatNumber,
} from "utils/common"
import mochiPay from "../../../adapters/mochi-pay"
import { getProfileIdByDiscord } from "../../../utils/profile"
import { convertString } from "../../../utils/convert"
import { APPROX } from "../../../utils/constants"

export async function handleStatement(
  args: string,
  authorId: string,
  inflow?: boolean,
  outflow?: boolean
) {
  const profileId = await getProfileIdByDiscord(authorId)
  const bals = await mochiPay.getBalances({
    profileId,
  })
  if (!bals.ok) {
    throw new APIError({ curl: bals.curl, description: bals.log })
  }
  const symbol = args ? args.toUpperCase() : ""
  // get balance and price in usd
  let currentBal = 0
  let currentPrice = 0
  bals.data?.forEach((bal: any) => {
    if (symbol === bal.symbol) {
      const amount = convertString(bal.amount, bal.token.decimal)
      currentBal = amount
      currentPrice = bal.quote_rate ?? 0
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
        col1 += `<@${authorId}>\n${getEmoji("REPLY")} **${item.action}**\n\n`
        col2 += `**- ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (${APPROX} $${roundFloatNumber(
          currentPrice * item.amount,
          4
        )})\n\n`
        return
      }
      if (item.action === "deposit") {
        col1 += `<@${authorId}>\n${getEmoji("REPLY")} **${item.action}**\n\n`
        col2 += `**+ ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (${APPROX} $${roundFloatNumber(
          currentPrice * item.amount,
          4
        )})\n\n`
        return
      }
      if (item.sender_id === authorId) {
        col1 += `<@${item.receiver_id}>\n${getEmoji("REPLY")} **${
          item.action
        }**\n\n`
        col2 += `**- ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (${APPROX} $${roundFloatNumber(
          currentPrice * item.amount,
          4
        )})\n\n`
      } else {
        col1 += `<@${item.sender_id}>\n${getEmoji("REPLY")} **${
          item.action
        }**\n\n`
        col2 += `**+ ${roundFloatNumber(item.amount, 4)} ${
          item.token
        }**\n (${APPROX} $${roundFloatNumber(
          currentPrice * item.amount,
          4
        )})\n\n`
      }
    })
    let des = `**Balance: ${roundFloatNumber(
      currentBal,
      4
    )} ${symbol}** (${APPROX} $${roundFloatNumber(
      currentPrice * currentBal,
      4
    )})`
    if (!symbol) {
      des += bals.data
        ?.map((bal: any) => {
          const amount = convertString(bal.amount, bal.token.decimal)
          const tokenBalance = roundFloatNumber(amount ?? 0, 4)
          if (tokenBalance === 0) return
          const tokenBalanceInUSD = roundFloatNumber(bal.quote_rate ?? 0, 4)
          return `**${bal.token.name}: ${tokenBalance} ${symbol}** (${APPROX} $${tokenBalanceInUSD})`
        })
        .join("\n")
    }
    return composeEmbedMessage(null, {
      title: `${getEmoji("STATEMENTS")} Transaction history`,
      footer: [`Page ${idx + 1} / ${pages.length}`],
      color: msgColors.SUCCESS,
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

export function listenButtonsRow(
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
          style: MessageButtonStyles.SECONDARY,
          label: "Cash inflow",
          customId: `statement_cash_inflow`,
        })
        .addComponents({
          type: MessageComponentTypes.BUTTON,
          style: MessageButtonStyles.SECONDARY,
          label: "Cash outflow",
          customId: `statement_cash_outflow`,
        }),
    ]
  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton({
        type: MessageComponentTypes.BUTTON,
        style: MessageButtonStyles.SECONDARY,
        customId: `page_${page}_-_${totalPage}`,
      }).setEmoji(getEmoji("LEFT_ARROW"))
    )
    .addComponents(
      new MessageButton({
        type: MessageComponentTypes.BUTTON,
        style: MessageButtonStyles.SECONDARY,
        customId: `page_${page}_+_${totalPage}`,
      }).setEmoji(getEmoji("RIGHT_ARROW"))
    )
    .addComponents({
      type: MessageComponentTypes.BUTTON,
      style: MessageButtonStyles.SECONDARY,
      label: "Cash inflow",
      customId: `statement_cash_inflow`,
    })
    .addComponents({
      type: MessageComponentTypes.BUTTON,
      style: MessageButtonStyles.SECONDARY,
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

// slash
export function listenSlashButtonsRow(
  interaction: CommandInteraction,
  args: string,
  pages: any,
  render: (
    interaction: CommandInteraction,
    pageIdx: number,
    pages: any
  ) => Promise<{ messageOptions: MessageOptions }>
) {
  const operators: Record<string, number> = {
    "+": 1,
    "-": -1,
  }

  interaction.channel
    ?.createMessageComponentCollector({
      componentType: MessageComponentTypes.BUTTON,
      idle: 60000,
      filter: authorFilter(interaction.user.id),
    })
    .on("collect", async (i) => {
      const [pageStr, opStr] = i.customId.split("_").slice(1)
      let page = +pageStr + operators[opStr]
      if (i.customId.includes("statement_cash")) {
        const [flow] = i.customId.split("_").slice(2)
        const newPages = await handleStatement(
          args,
          interaction.user.id,
          flow === "inflow",
          flow === "outflow"
        )
        pages = newPages
        page = 0
      }
      const {
        messageOptions: { embeds, components },
      } = await render(interaction, page, pages)

      const msgComponents = components
      await interaction
        .editReply({
          embeds,
          components: msgComponents,
        })
        .catch(() => null)
    })
    .on("end", () => {
      interaction.editReply({ components: [] }).catch(() => null)
    })
}
