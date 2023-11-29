import config from "adapters/config"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError, GuildIdNotFoundError } from "errors"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { Message } from "discord.js"
import { getSlashCommand } from "utils/commands"

export async function runTipRangeInfo(
  msg: Message | null,
  guildId: string | null,
) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: msg ?? undefined })
  }
  const res = await config.getTipRangeConfig(guildId)
  if (!res.ok) {
    throw new APIError({
      msgOrInteraction: msg ?? undefined,
      curl: res.curl,
      description: res.log,
      status: res.status ?? 500,
    })
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No config tiprange found",
            author: ["Tip range", getEmojiURL(emojis.APPROVE)],
            description: `You haven't set min and max tip for server.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} To set a new one, run ${await getSlashCommand(
              "config tiprange set",
            )}.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Then re-check your configuration using ${await getSlashCommand(
              "config tiprange info",
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
          author: ["Tip range", getEmojiURL(emojis.APPROVE)],
          description: `Min: $${res.data.min}\nMax: $${res.data.max}`,
          color: msgColors.PINK,
        }),
      ],
    },
  }
}
