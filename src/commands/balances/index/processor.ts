import Defi from "adapters/defi"
import {
  ButtonInteraction,
  EmbedFieldData,
  MessageActionRow,
  MessageButton,
} from "discord.js"
import { APIError, OriginalMessage } from "errors"
import { UserBalances } from "types/defi"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, roundFloatNumber } from "utils/common"

export const balanceTypes: Record<string, number> = {
  Offchain: 1,
  Onchain: 2,
  Total: 3,
}

const balanceEmbedProps = {
  [balanceTypes.Offchain]: {
    title: "Offchain balance",
    description: `${getEmoji(
      "pointingright"
    )} You can withdraw the coin to you crypto wallet by \`$withdraw\`.\n${getEmoji(
      "pointingright"
    )} All the tip transaction will take from this balance. You can try \`$tip <recipient> <amount> <token>\` to transfer coin.`,
  },
  [balanceTypes.Onchain]: {
    title: "Onchain balance",
    description: `This balance shows the total amount of pending on-chain transactions.\n${getEmoji(
      "pointingright"
    )} You can transfer received token to your crypto wallet by claiming in your DM \`$claim <Claim ID> <your recipient address>\`.\n${getEmoji(
      "pointingright"
    )} All the tip transaction won't take from this balance.`,
  },
  [balanceTypes.Total]: {
    title: "Total",
    description: "This balance including both onchain and offchain balance.",
  },
}

const row = (type: number) => {
  return new MessageActionRow().addComponents(
    new MessageButton({
      customId: `balance-${balanceTypes.Offchain}`,
      style: "SECONDARY",
      label: "Off-chain",
      disabled: type === balanceTypes.Offchain,
    }),
    new MessageButton({
      customId: `balance-${balanceTypes.Onchain}`,
      style: "SECONDARY",
      label: "On-chain",
      disabled: type === balanceTypes.Onchain,
    }),
    new MessageButton({
      customId: `balance-${balanceTypes.Total}`,
      style: "SECONDARY",
      label: "Total",
      disabled: type === balanceTypes.Total,
    })
  )
}

const balancesFetcher: Record<number, (userId: string) => Promise<any>[]> = {
  [balanceTypes.Offchain]: (userId) => [
    Defi.offchainGetUserBalances({ userId }),
  ],
  [balanceTypes.Onchain]: (userId) => [Defi.getUserOnchainBalances(userId)],
  [balanceTypes.Total]: (userId) => [
    Defi.offchainGetUserBalances({ userId }),
    Defi.getUserOnchainBalances(userId),
  ],
}

async function getBalances(userId: string, type: number, msg: OriginalMessage) {
  const fetcher = balancesFetcher[type]
  const res = await Promise.all(fetcher(userId))
  const ok = res[0].ok && (res[1]?.ok ?? true)
  if (!ok) {
    throw new APIError({
      message: msg,
      curl: "",
    })
  }
  const data = res[0].data.concat(res[1]?.data).filter((i: any) => Boolean(i))
  const groupedData: Record<string, any> = data.reduce(
    (acc: Record<string, UserBalances>, cur: any) => {
      if (!cur.symbol) return cur
      cur.balances += acc[cur.symbol]?.balances ?? 0
      cur.balances_in_usd += acc[cur.symbol]?.balances_in_usd ?? 0
      return { ...acc, [cur.symbol]: cur }
    },
    {}
  )
  return Object.values(groupedData)
}

export async function renderBalances(
  userId: string,
  msg: OriginalMessage,
  type: number
) {
  const balances = await getBalances(userId, type, msg)
  const fields: EmbedFieldData[] = []
  const blank = getEmoji("blank")
  balances?.forEach((balance: UserBalances) => {
    const tokenName = balance["name"]
    const tokenEmoji = getEmoji(balance["symbol"])
    const tokenBalance = roundFloatNumber(balance["balances"] ?? 0, 4)
    if (tokenBalance === 0) return
    const tokenBalanceInUSD = roundFloatNumber(balance["balances_in_usd"], 4)

    const balanceInfo = `${tokenEmoji} ${tokenBalance} ${balance["symbol"]} \`$${tokenBalanceInUSD}\` ${blank}`
    fields.push({ name: tokenName, value: balanceInfo, inline: true })
  })

  const props = balanceEmbedProps[type]
  if (!fields.length) {
    const embed = composeEmbedMessage(null, {
      author: [props.title, getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
    })
    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  }

  const totalBalanceInUSD = balances.reduce(
    (accumulator: number, balance: UserBalances) => {
      return accumulator + balance["balances_in_usd"]
    },
    0
  )

  const embed = composeEmbedMessage(null, {
    author: [props.title, getEmojiURL(emojis.WALLET)],
    description: props.description,
  }).addFields(fields)
  justifyEmbedFields(embed, 3)
  embed.addFields({
    name: `Estimated total (U.S dollar)`,
    value: `${getEmoji("cash")} \`$${roundFloatNumber(totalBalanceInUSD, 4)}\``,
  })

  return {
    messageOptions: {
      embeds: [embed],
      components: [row(type)],
    },
    buttonCollector: {
      handler: async (i: ButtonInteraction) => {
        const type = +i.customId.split("-")[1]
        return await renderBalances(userId, msg, type)
      },
    },
  }
}
