import community from "adapters/community"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"

export async function handle(msg: OriginalMessage) {
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({})
  }

  const { ok, log, curl } = await community.removeLevelMessageConfig({
    guild_id: msg.guildId,
  })
  if (!ok) {
    throw new APIError({
      msgOrInteraction: msg,
      description: log,
      curl,
    })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji(
            "approve"
          )} Successfully delete leveled-up message`,
          description: `Your server won’t get any notification message when a user is leveled up.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT", true
          )} You can still check the level of each member by using \`$profile\` or the top high-level member by using \`$top\`.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT", true
          )} You can set up a new leveled-up message to encourage members by using \`$levelmessage set <message content> <image>\`.`,
          color: msgColors.SUCCESS,
        }),
      ],
    },
  }
}
