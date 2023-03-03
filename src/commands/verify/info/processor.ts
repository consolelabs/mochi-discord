import community from "adapters/community"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError, GuildIdNotFoundError } from "errors"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { Message } from "discord.js"

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
              "POINTINGRIGHT"
            )} To set a new one, run \`verify set #<channel> @<verified role>\`.\n${getEmoji(
              "POINTINGRIGHT"
            )} Then re-check your configuration using \`verify info.\``,
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
          footer: ["To change verify channel and role, use $verify remove"],
        }),
      ],
    },
  }
}
