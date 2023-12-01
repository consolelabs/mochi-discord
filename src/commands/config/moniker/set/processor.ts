import config from "adapters/config"
import { APIError, InternalError, OriginalMessage } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
import { HOMEPAGE_URL, SLASH_PREFIX } from "utils/constants"
import { isTokenSupported } from "utils/tip-bot"
import { getSlashCommand } from "utils/commands"

export const handleSetMoniker = async (
  payload: RequestUpsertMonikerConfigRequest,
  message: OriginalMessage,
) => {
  // we want moniker to contain characters a.k.a NaN when trying to parse to Number
  if (!Number.isNaN(Number(payload.moniker))) {
    throw new InternalError({
      msgOrInteraction: message,
      description: "Moniker can not be only numbers",
    })
  }
  const tokenValid = await isTokenSupported(payload.token)
  if (!tokenValid) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Unsupported token",
            description: `**${payload.token.toUpperCase()}** hasn't been supported.\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true,
            )}.`,
          }),
        ],
      },
    }
  }
  const {
    ok,
    log,
    curl,
    status = 500,
    error,
  } = await config.setMonikerConfig(payload)
  if (!ok) {
    throw new APIError({ description: log, curl, status, error })
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Moniker successfully set", getEmojiURL(emojis.CHECK)],
          thumbnail: getEmojiURL(emojis.CONFIG),
          description: `Moniker: [\`${
            payload.moniker
          }\`](${HOMEPAGE_URL}) is set as ${payload.amount} ${
            payload.token
          }\n\nUse ${await getSlashCommand(
            "vault list",
          )} to tip your friend with moniker\ne.g. \`${SLASH_PREFIX}tip @anna 1 cookie\`\nRelate commands: ${[
            "set",
            "remove",
            "list",
          ].map((c) => `\`${SLASH_PREFIX}${c}\``)}`,
          color: msgColors.SUCCESS,
        }),
      ],
    },
  }
}
