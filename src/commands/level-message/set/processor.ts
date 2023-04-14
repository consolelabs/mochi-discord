import community from "adapters/community"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import { getEmoji, msgColors } from "utils/common"

export async function handle(
  args: string[],
  image_url: string,
  message: OriginalMessage
) {
  if (!message.guildId) {
    throw new GuildIdNotFoundError({})
  }
  let msgContent = args.slice(0, -1).join(" ").trim()
  const { isChannel, value: channel_id } = parseDiscordToken(
    args[args.length - 1]
  )
  if (!isChannel) {
    msgContent = args.join(" ").trim()
  }

  const { ok, data, log, curl } = await community.setLevelMessageConfig({
    guild_id: message.guildId,
    message: msgContent,
    channel_id,
    image_url,
  })

  if (!ok) {
    throw new APIError({ msgOrInteraction: message, curl, description: log })
  }

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("approve")} Successfully set leveled-up message`,
    description: `${getEmoji(
      "ANIMATED_POINTING_RIGHT",
      true
    )} You can take a look at the preview message:\n${data.message}`,
    color: msgColors.SUCCESS,
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
