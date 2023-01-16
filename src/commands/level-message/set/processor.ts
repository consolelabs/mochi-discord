import config from "adapters/config"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import { getEmoji } from "utils/common"

export async function handle(args: string[], message: OriginalMessage) {
  if (!message.guildId) {
    throw new GuildIdNotFoundError({})
  }

  if (args.length > 1) {
    const { isChannel } = parseDiscordToken(args[1])
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              title: "Invalid channels",
              description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n${getEmoji(
                "pointingright"
              )} Type # to see the channel list.\n${getEmoji(
                "pointingright"
              )} To add a new channel: 1. Create channel → 2. Confirm`,
            }),
          ],
        },
      }
    }
  }

  const { ok, log, curl } = await config.setLevelMessageConfig(message.guildId)

  if (!ok) {
    throw new APIError({ message, curl, description: log })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: `${getEmoji("approve")} Successfully set leveled-up message`,
          description: `${getEmoji(
            "pointingright"
          )} You can take a look at the preview message:\n${args[0]}`,
        }),
      ],
    },
  }
}
