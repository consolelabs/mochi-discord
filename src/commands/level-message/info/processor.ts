import config from "adapters/config"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji } from "utils/common"

export async function handle(msg: OriginalMessage) {
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({})
  }
  const { ok, data, log, curl } = await config.getLevelMessageConfig(
    msg.guildId
  )
  if (!ok) {
    throw new APIError({
      message: msg,
      description: log,
      curl,
    })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("pumpeet")} Levelup message`,
          description: `${
            data.channel ? `Storing channel: ${data.channel}\n` : ""
          }Leveled-up message: ${data.message}`,
        }),
      ],
    },
  }
}
