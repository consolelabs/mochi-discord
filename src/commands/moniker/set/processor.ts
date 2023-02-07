import config from "adapters/config"
import { APIError } from "errors"
import { RequestUpsertMonikerConfigRequest } from "types/api"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"

export const handleSetMoniker = async (
  payload: RequestUpsertMonikerConfigRequest
) => {
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
        }),
      ],
    },
  }
}
