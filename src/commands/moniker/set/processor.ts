import config from "adapters/config"
import { APIError } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"
import { isTokenSupported } from "utils/tip-bot"

export const handleSetMoniker = async (
  payload: RequestUpsertMonikerConfigRequest
) => {
  const tokenValid = await isTokenSupported(payload.token)
  if (!tokenValid) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Unsupported token",
            description: `**${payload.token.toUpperCase()}** hasn't been supported.\n${getEmoji(
              "POINTINGRIGHT"
            )} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${getEmoji(
              "POINTINGRIGHT"
            )}.`,
          }),
        ],
      },
    }
  }
  const { ok, log, curl } = await config.setMonikerConfig(payload)
  if (!ok) {
    throw new APIError({ description: log, curl })
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("approve")} Moniker successfully set`,
          description: `1 **${payload.moniker}** is set as ${
            payload.amount
          } **${
            payload.token
          }**. To tip your friend moniker, use $tip <@users> <amount> <moniker>. ${getEmoji(
            "bucket_cash",
            true
          )}`,
          color: msgColors.SUCCESS,
        }),
      ],
    },
  }
}
