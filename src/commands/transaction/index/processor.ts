import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { APIError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { ButtonInteraction, CommandInteraction } from "discord.js"
import profile from "adapters/profile"
import mochiPay from "adapters/mochi-pay"
import { paginationButtons } from "utils/router"
import UI, { Platform, PageSize } from "@consolelabs/mochi-formatter"

export async function render(
  i: CommandInteraction | ButtonInteraction,
  page = 0,
) {
  const userDiscordId = i.user.id
  const dataProfile = await profile.getByDiscord(userDiscordId)
  if (dataProfile.err) {
    throw new APIError({
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
      status: dataProfile.status ?? 500,
      error: dataProfile.error,
    })
  }
  if (!dataProfile)
    return {
      context: {
        page,
      },
      msgOpts: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No transactions found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} This user does not have any transactions yet`,
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }

  const {
    data: txns,
    pagination,
    ok,
    curl,
    error,
    log,
    status = 500,
  } = await mochiPay.getListTx(dataProfile.id, { page, size: PageSize.Medium })
  if (!ok) {
    throw new APIError({ curl, error, description: log, status })
  }
  if (!txns) {
    return {
      context: {
        page,
      },
      msgOpts: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No transactions found",
            description: `${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} This user does not have any transactions yet`,
            color: msgColors.ACTIVITY,
          }),
        ],
      },
    }
  }

  const total = pagination?.total
    ? Math.ceil(pagination?.total / PageSize.Medium)
    : 1
  const { text: description } = await UI.components.txns({
    txns: txns as any,
    on: Platform.Discord,
    groupDate: true,
    page,
    total,
    profileId: dataProfile.id,
  })

  const embed = composeEmbedMessage(null, {
    color: msgColors.BLUE,
    author: ["Transactions", getEmojiURL(emojis.TRANSACTIONS)],
    description,
  })
  return {
    context: {
      page,
    },
    msgOpts: {
      embeds: [embed],
      components: [...paginationButtons(page, total)],
    },
  }
}
