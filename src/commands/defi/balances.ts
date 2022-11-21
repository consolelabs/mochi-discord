import { Command } from "types/common"
import { EmbedFieldData, Message } from "discord.js"
import { BALANCE_GITBOOK, PREFIX, DEFI_DEFAULT_FOOTER } from "utils/constants"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import { APIError, OriginalMessage } from "errors"
import Defi from "adapters/defi"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
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
  res.data.forEach((balance: UserBalances) => {
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

const command: Command = {
  id: "balances",
  command: "balances",
  brief: "Wallet balances",
  category: "Defi",
  run: async function balances(msg: Message) {
    return handleBal(msg.author.id, msg)
  },
  featured: {
    title: `${getEmoji("cash")} Balance`,
    description: "Show your balances",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        usage: `${PREFIX}balance`,
        description: "Show your offchain balances",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${PREFIX}balance\n${PREFIX}bals\n${PREFIX}bal`,
        document: BALANCE_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["balance", "bal", "bals"],
  allowDM: true,
  colorType: "Defi",
}

export default command
