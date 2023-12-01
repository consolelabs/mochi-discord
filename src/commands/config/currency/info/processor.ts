import config from "adapters/config"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError, GuildIdNotFoundError } from "errors"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { Message } from "discord.js"
import { getSlashCommand } from "utils/commands"

export async function runCurrencyInfo(
  msg: Message | null,
  guildId: string | null,
) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: msg ?? undefined })
  }
  const res = await config.getDefaultCurrency(guildId)
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg ?? undefined,
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
      error: res.error,
    })
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No default currency found",
            author: ["Currency", getEmojiURL(emojis.APPROVE)],
            description: `You haven't set default currency for server.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} To set a new one, run ${await getSlashCommand(
              "config currency set",
            )}.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Then re-check your configuration using ${await getSlashCommand(
              "config currency info",
            )}`,
            color: msgColors.PINK,
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Currency", getEmojiURL(emojis.APPROVE)],
          description: `Default currency: ${res.data.token_symbol}`,
          color: msgColors.PINK,
        }),
      ],
    },
  }
}
