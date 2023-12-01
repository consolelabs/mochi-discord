import config from "adapters/config"
import { APIError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { HOMEPAGE_URL } from "utils/constants"
import { getSlashCommand } from "utils/commands"

export const handleRemoveMoniker = async (
  payload: RequestDeleteMonikerConfigRequest,
) => {
  const {
    ok,
    log,
    curl,
    status = 500,
    error,
  } = await config.deleteMonikerConfig(payload)
  if (!ok) {
    throw new APIError({ description: log, curl, status, error })
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
            true,
          )} Set up a new moniker configuration ${await getSlashCommand(
            "config moniker set",
          )}\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true,
          )} See all moniker configurations ${await getSlashCommand(
            "config moniker list",
          )}`,
          color: msgColors.SUCCESS,
        }),
      ],
    },
  }
}
