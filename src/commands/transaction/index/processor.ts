import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import profile from "adapters/profile"
import mochiPay from "adapters/mochi-pay"
import { convertString } from "../../../utils/convert"

export async function render(i: CommandInteraction) {
  const userDiscordId = i.user.id
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }
  if (!dataProfile)
    return {
      messageOptions: {
        embed: composeEmbedMessage(null, {
          title: "No transactions found",
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} This user does not have any transactions yet`,
          color: msgColors.SUCCESS,
        }),
      },
    }

  const { data, ok, curl, error, log } = await mochiPay.getListTx({
    profile_id: dataProfile.id,
  })
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data)
    return {
      messageOptions: {
        embed: composeEmbedMessage(null, {
          title: "No transactions found",
          description: `${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} This user does not have any transactions yet`,
          color: msgColors.ACTIVITY,
        }),
      },
    }

  const formatTipTx = []
  for (const tx of data.offchain.slice(0, 10)) {
    const dataProfile = await profile.getById(tx.other_profile_id)
    if (dataProfile.err) continue
    if (!dataProfile || dataProfile.associated_accounts.length === 0) continue

    const discord = dataProfile.associated_accounts.filter(
      (acc: any) => acc.platform === "discord"
    )
    if (!discord || discord.length === 0) continue

    const type = tx.type === "debit" ? "Tipped" : "Received"
    const target =
      tx.type === "debit"
        ? `to <@${discord[0].platform_identifier}>`
        : `from <@${discord[0].platform_identifier}>`
    formatTipTx.push(
      `${type} ${convertString(tx.amount, tx.token.decimal, false)} ${
        tx.token.symbol
      } ${target}`
    )
  }

  const tipTx = formatTipTx.join("\n")

  const depTx = data.deposit
    .slice(0, 10)
    .map((tx: any) => {
      return `Deposited ${convertString(tx.amount, tx.token.decimal, false)} ${
        tx.token.symbol
      } from ${shortenHashOrAddress(tx.from)}`
    })
    .join("\n")

  const wdTx = data.withdraw
    .slice(0, 10)
    .map((tx: any) => {
      return `Withdraw ${convertString(tx.amount, tx.token.decimal, false)} ${
        tx.token.symbol
      } to ${shortenHashOrAddress(tx.address)}`
    })
    .join("\n")

  const fields = [
    {
      name: "Tip",
      value: tipTx ? tipTx : "\u200b",
      inline: false,
    },
    {
      name: "Deposit",
      value: depTx ? depTx : "\u200b",
      inline: false,
    },
    {
      name: "Withdraw",
      value: wdTx ? wdTx : "\u200b",
      inline: false,
    },
  ]

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    author: ["Transactions", getEmojiURL(emojis.TRANSACTIONS)],
  }).addFields(fields)

  return { messageOptions: { embeds: [embed] } }
}
