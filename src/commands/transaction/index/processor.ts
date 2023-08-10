import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  shortenHashOrAddress,
} from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import profile from "adapters/profile"
import mochiPay from "adapters/mochi-pay"
import { convertString } from "../../../utils/convert"
import { formatTokenDigit } from "utils/defi"

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

  const { data, ok, curl, error, log } = await mochiPay.getListTx(
    dataProfile.id
  )
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
    // tip
    new Promise((r) => {
      const sliced = data.deposit.slice(0, 10)
      r(
        formatDataTable(
          sliced.map((s: any) => ({
            left: `+ ${formatTokenDigit(
              convertString(s.amount, s.token.decimal, false).toString()
            )} ${s.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
            right: shortenHashOrAddress(s.from, 4) ?? "Unknown",
          })),
          { cols: ["left", "right"], noWrap: true }
        ).joined
      )
    }),
    // withdraw
    new Promise((r) => {
      const sliced = data.withdraw.slice(0, 10)
      r(
        formatDataTable(
          sliced.map((s: any) => ({
            left: `- ${formatTokenDigit(
              convertString(s.amount, s.token.decimal, false).toString()
            )} ${s.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
            right: shortenHashOrAddress(s.address, 4) ?? "Unknown",
          })),
          { cols: ["left", "right"], noWrap: true }
        ).joined
      )
    }),
    // tip
    new Promise((resolve) => {
      const users = new Map<string, string>()
      Promise.all(
        data.offchain.slice(0, 10).map(async (tx: any) => {
          if (!tx.other_profile_id) return null

          let targetUser = users.get(tx.other_profile_id)
          const type = tx.type === "debit" ? "-" : "+"
          const anonUser = {
            left: `${type} ${formatTokenDigit(
              convertString(tx.amount, tx.token.decimal, false).toString()
            )} ${tx.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
            right: "someone",
          }
          if (!targetUser) {
            const dataProfile = await profile.getById(tx.other_profile_id)
            if (
              dataProfile.err ||
              !dataProfile ||
              !dataProfile.associated_accounts ||
              dataProfile.associated_accounts.length === 0
            )
              return anonUser

            const discord = dataProfile.associated_accounts.find(
              (acc: any) => acc.platform === "discord"
            )
            if (!discord) return anonUser

            targetUser = (
              await i.client.users.fetch(discord.platform_identifier)
            )?.tag
            users.set(tx.other_profile_id, targetUser)
          }

          anonUser.right = targetUser ?? "someone"
          return anonUser
        })
      ).then((tipTxs) => {
        resolve(
          formatDataTable(
            tipTxs.filter(Boolean).map((txn) => ({
              left: txn.left,
              right: txn.right,
            })),
            {
              cols: ["left", "right"],
              noWrap: true,
              alignment: ["left", "left"],
            }
          ).joined
        )
      })
    }),
  ])

  const fields = [
    ...(data.offchain.length
      ? [
          {
            name: "Tip",
            value: `\`\`\`diff\n${tip}\`\`\``,
            inline: false,
          },
        ]
      : []),
    ...(data.deposit.length
      ? [
          {
            name: "Deposit",
            value: `\`\`\`diff\n${dep}\`\`\``,
            inline: false,
          },
        ]
      : []),
    ...(data.withdraw.length
      ? [
          {
            name: "Withdraw",
            value: `\`\`\`diff\n${withdraw}\`\`\``,
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
