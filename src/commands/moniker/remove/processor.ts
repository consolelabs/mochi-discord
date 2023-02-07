import config from "adapters/config"
import { APIError } from "errors"
import { RequestDeleteMonikerConfigRequest } from "types/api"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"

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
          title: `${getEmoji("approve")} Successfully removed`,
          description: `**${
            payload.moniker
          }** is removed. To set the new one, run $moniker set <moniker> <amount_token> <token>. ${getEmoji(
            "bucket_cash",
            true
          )}`,
        }),
      ],
    },
  }
}
