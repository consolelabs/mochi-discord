import { composeEmbedMessage } from "ui/discord/embed"
import config from "adapters/config"
import { emojis, getEmojiURL } from "utils/common"

export async function handle(guildId: string) {
  const data = await config.getCurrentGmConfig(guildId)
  if (!data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["GM/GN Channel", getEmojiURL(emojis.GOOD_MORNING)],
            description:
              "No GM/GN channel configured. To set one, run `$gm set <#channel> [phrase] [emoji] [sticker]`.",
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          description: `Current Gm/Gn channel is set to <#${data.channel_id}>`,
          author: ["GM/GN Channel", getEmojiURL(emojis.GOOD_MORNING)],
          footer: ["To change the channel, use $gm set"],
        }),
      ],
    },
  }
}
