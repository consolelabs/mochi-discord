import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { CommandInteraction } from "discord.js"
import profile from "adapters/profile"
import mochiPay from "adapters/mochi-pay"
import { fmt } from "utils/formatter"
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

  const {
    data: txns,
    ok,
    curl,
    error,
    log,
  } = await mochiPay.getListTx(dataProfile.id, {})
  if (!ok) {
    throw new APIError({ curl, error, description: log })
  }
  if (!txns) {
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

  const { text: description } = await fmt.components.txns({
    txns: txns as any,
    on: Platform.Discord,
    groupDate: true,
  })

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    author: ["Transactions", getEmojiURL(emojis.TRANSACTIONS)],
    description,
  })
  return { messageOptions: { embeds: [embed] } }
}
