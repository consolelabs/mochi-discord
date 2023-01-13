import { EmbedFieldData } from "discord.js"
import { emojis, getEmoji, getEmojiURL, roundFloatNumber } from "utils/common"
import { APIError, OriginalMessage } from "errors"
import Defi from "adapters/defi"
import { composeEmbedMessage, justifyEmbedFields } from "discord/embed/ui"
import { UserBalances } from "types/defi"

export async function handleBal(userId: string, message: OriginalMessage) {
  // case API return 500 or unexpected result
  const res = await Defi.offchainGetUserBalances({ userId })
  if (!res.ok) {
    throw new APIError({ message, curl: res.curl, description: res.log })
  }

  // case data normal
  const fields: EmbedFieldData[] = []
  const blank = getEmoji("blank")
  res.data?.forEach((balance: UserBalances) => {
    const tokenName = balance["name"]
    const tokenEmoji = getEmoji(balance["symbol"])
    const tokenBalance = roundFloatNumber(balance["balances"] ?? 0, 4)
    if (tokenBalance === 0) return
    const tokenBalanceInUSD = roundFloatNumber(balance["balances_in_usd"], 4)

    const balanceInfo = `${tokenEmoji} ${tokenBalance} ${balance["symbol"]} \`$${tokenBalanceInUSD}\` ${blank}`
    fields.push({ name: tokenName, value: balanceInfo, inline: true })
  })

  // case data = null || []
  if (!fields.length) {
    const embed = composeEmbedMessage(null, {
      author: ["Your balances", getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
    })
    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  }

  const totalBalanceInUSD = res.data.reduce(
    (accumulator: number, balance: UserBalances) => {
      return accumulator + balance["balances_in_usd"]
    },
    0
  )

  const embed = composeEmbedMessage(null, {
    author: ["Your balances", getEmojiURL(emojis.WALLET)],
  }).addFields(fields)
  justifyEmbedFields(embed, 3)
  embed.addFields({
    name: `Estimated total (U.S dollar)`,
    value: `${getEmoji("cash")} \`$${roundFloatNumber(totalBalanceInUSD, 4)}\``,
  })

  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}
