import community from "adapters/community"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError, GuildIdNotFoundError } from "errors"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { Message } from "discord.js"
import { getSlashCommand } from "utils/commands"

export async function runVerify(msg: Message | null, guildId: string | null) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: msg ?? undefined })
  }
  const res = await community.getVerifyWalletChannel(guildId)
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
            title: "No verified channel found",
            author: ["Verify", getEmojiURL(emojis.APPROVE)],
            description: `You haven't set a channel for verification.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} To set a new one, run ${await getSlashCommand(
              "config verify set",
            )}.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Then re-check your configuration using ${await getSlashCommand(
              "config verify info",
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
          author: ["Verify", getEmojiURL(emojis.APPROVE)],
          description: `Verify channel: <#${res.data.verify_channel_id}>${
            res.data.verify_role_id
              ? `\nVerify role: <@&${res.data.verify_role_id}>`
              : ""
          }`,
          color: msgColors.PINK,
        }),
      ],
    },
  }
}
