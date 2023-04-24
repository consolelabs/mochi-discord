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

async function format(data: any[], type: "deposit" | "withdraw") {
  let longestStr = 0
  return `\n${data
    .slice(0, 10)
    .map((tx: any) => {
      const amount = `${convertString(tx.amount, tx.token.decimal, false)} ${
        tx.token.symbol
      }`

      longestStr = Math.max(longestStr, amount.length)

      return {
        ...tx,
        amount,
      }
    })
    .map((tx: any) => {
      return `${type === "deposit" ? "+" : "-"} ${tx.amount}${" ".repeat(
        longestStr - tx.amount.length
      )} | ${
        shortenHashOrAddress(tx[type === "deposit" ? "from" : "address"], 4) ??
        "Unknown"
      }`
    })
    .join("\n")}`
}

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

  const [dep, withdraw, tip] = await Promise.all([
    format(data.deposit, "deposit"),
    format(data.withdraw, "withdraw"),
    new Promise((resolve) => {
      const users = new Map<string, string>()
      let longestStr = 0
      Promise.all(
        data.offchain
          .slice(0, 10)
          .map((tx: any) => {
            const amount = `${convertString(
              tx.amount,
              tx.token.decimal,
              false
            )} ${tx.token.symbol}`

            longestStr = Math.max(longestStr, amount.length)

            return {
              ...tx,
              amount,
            }
          })
          .map(async (tx: any) => {
            let targetUser = users.get(tx.other_profile_id)
            const type = tx.type === "debit" ? "-" : "+"
            if (!targetUser) {
              const dataProfile = await profile.getById(tx.other_profile_id)
              if (
                dataProfile.err ||
                !dataProfile ||
                dataProfile.associated_accounts.length === 0
              )
                return null

              const discord = dataProfile.associated_accounts.filter(
                (acc: any) => acc.platform === "discord"
              )
              if (!discord || discord.length === 0) return null

              targetUser = (
                await i.client.users.fetch(discord[0].platform_identifier)
              )?.tag
              users.set(tx.other_profile_id, targetUser)
            }

            return `${type} ${tx.amount}${" ".repeat(
              longestStr - tx.amount.length
            )} | ${targetUser ?? "someone"}`
          })
      ).then((tipTxs) => {
        resolve(`\n${tipTxs.filter(Boolean).join("\n")}`)
      })
    }),
  ])

  const fields = [
    ...(tip
      ? [
          {
            name: "Tip",
            value: `\`\`\`diff${tip}\`\`\``,
            inline: false,
          },
        ]
      : []),
    ...(dep
      ? [
          {
            name: "Deposit",
            value: `\`\`\`diff${dep}\`\`\``,
            inline: false,
          },
        ]
      : []),
    ...(withdraw
      ? [
          {
            name: "Withdraw",
            value: `\`\`\`diff${withdraw}\`\`\``,
            inline: false,
          },
        ]
      : []),
  ]

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    author: ["Transactions", getEmojiURL(emojis.TRANSACTIONS)],
  }).addFields(fields)

  return { messageOptions: { embeds: [embed] } }
}
