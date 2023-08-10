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
import { groupBy } from "lodash"
import { fmt, utils } from "utils/formatter"
import { Platform } from "@consolelabs/mochi-formatter"

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
    dataProfile.id,
    {}
  )
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!data) {
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
  }

  const txnsGroupByAction = groupBy(
    data.filter((tx: any) => tx.action !== "swap"), // filter out swap tx
    "action"
  )
  const depositTxns = (txnsGroupByAction["deposit"] ?? []).slice(0, 10)
  const withdrawTxns = (txnsGroupByAction["withdraw"] ?? []).slice(0, 10)
  const tipTxns = (txnsGroupByAction["transfer"] ?? []).slice(0, 10)

  const [dep, withdraw, tip] = await Promise.all([
    // deposit
    new Promise((r) => {
      r(
        utils.mdTable(
          depositTxns.map((s: any) => ({
            left: `+ ${utils.formatTokenDigit(
              convertString(s.amount, s.token.decimal, false).toString()
            )} ${s.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
            right: shortenHashOrAddress(s.from, 4) ?? "Unknown",
          })),
          { cols: ["left", "right"], wrapLastCol: false }
        )
      )
    }),
    // withdraw
    new Promise((r) => {
      r(
        utils.mdTable(
          withdrawTxns.map((s: any) => ({
            left: `- ${utils.formatTokenDigit(
              convertString(s.amount, s.token.decimal, false).toString()
            )} ${s.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
            right: shortenHashOrAddress(s.address, 4) ?? "Unknown",
          })),
          { cols: ["left", "right"], wrapLastCol: false }
        )
      )
    }),
    // tip
    new Promise((resolve) => {
      Promise.all(
        tipTxns.map(async (tx: any) => {
          const txRow = {
            left: `${tx.type === "out" ? "-" : "+"} ${utils.formatTokenDigit(
              convertString(tx.amount, tx.token.decimal, false).toString()
            )} ${tx.token?.symbol?.toUpperCase() ?? "TOKEN"}`,
            right: "someone",
          }
          const [targetUser] = await fmt.account(
            Platform.Discord,
            tx.other_profile_id
          )
          if (!targetUser) {
            return txRow
          }
          txRow.right = targetUser.value
          return txRow
        })
      ).then((txRow) => {
        resolve(
          utils.mdTable(txRow, {
            cols: ["left", "right"],
            wrapLastCol: false,
            alignment: ["left", "left"],
          })
        )
      })
    }),
  ])

  const fields = [
    ...(tipTxns.length
      ? [
          {
            name: "Tip",
            value: `${tip}`,
            inline: false,
          },
        ]
      : []),
    ...(depositTxns.length
      ? [
          {
            name: "Deposit",
            value: `${dep}`,
            inline: false,
          },
        ]
      : []),
    ...(withdrawTxns.length
      ? [
          {
            name: "Withdraw",
            value: `${withdraw}`,
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
