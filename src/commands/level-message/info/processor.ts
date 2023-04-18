import community from "adapters/community"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"

export async function handle(msg: OriginalMessage) {
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({})
  }
  const { ok, data, log, curl } = await community.getLevelMessageConfig(
    msg.guildId
  )
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      description: log,
      curl,
    })
  }

  if (!data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No levelup message found",
            description: `You haven't set any levelup message yet.\n\nTo set a new one, run \`$levelmessage set <message content> [log channel] [image]\``,
            color: msgColors.PINK,
          }),
        ],
      },
    }
  }

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("PUMPEET")} Levelup message`,
    description: `${
      data.channel_id ? `Storing channel: <#${data.channel_id}>\n` : ""
    }Leveled-up message: ${data.message}`,
    color: msgColors.PINK,
  })
  if (data.image_url !== "") {
    embed.setImage(data.image_url)
  }

  return {
    messageOptions: {
      embeds: [embed],
    },
  }
}
