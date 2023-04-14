import config from "adapters/config"
import { APIError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { HOMEPAGE_URL, SLASH_PREFIX } from "utils/constants"

export const handleRemoveMoniker = async (
  payload: RequestDeleteMonikerConfigRequest
) => {
  const { ok, log, curl } = await config.deleteMonikerConfig(payload)
  if (!ok) {
    throw new APIError({ description: log, curl })
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Successfully removed", getEmojiURL(emojis.BIN)],
          description: `[\`${
            payload.moniker
          }\`](${HOMEPAGE_URL}) is removed from server\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Set up a new moniker configuration \`${SLASH_PREFIX}moniker set\`\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} See all moniker configurations \`${SLASH_PREFIX}moniker list\``,
          color: msgColors.SUCCESS,
        }),
      ],
    },
  }
}
