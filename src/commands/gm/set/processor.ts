import { APIError } from "errors"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import Config from "../../../adapters/config"

export async function handle(
  guildId: string,
  channelId: string,
  msg: string,
  emoji: string,
  sticker: string,
) {
  const config = await Config.updateGmConfig({
    guild_id: guildId,
    channel_id: channelId,
    msg,
    emoji,
    sticker,
  })
  if (!config.ok) {
    throw new APIError({
      curl: config.curl,
      description: config.log,
      status: config.status ?? 500,
    })
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Successfully set", getEmojiURL(emojis["APPROVE"])],
          description: `${getEmoji(
            "GOOD_MORNING",
          )} Let your members repeat the phrase "${msg}", or ${emoji} in <#${channelId}> to join the streak.`,
        }),
      ],
    },
  }
}
