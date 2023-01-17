import community from "adapters/community"
import { APIError, GuildIdNotFoundError, OriginalMessage } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { parseDiscordToken } from "utils/commands"
import { getEmoji } from "utils/common"

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
    // return {
    //   messageOptions: {
    //     embeds: [
    //       composeEmbedMessage(null, {
    //         title: "Invalid channels",
    //         description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n${getEmoji(
    //           "pointingright"
    //         )} Type # to see the channel list.\n${getEmoji(
    //           "pointingright"
    //         )} To add a new channel: 1. Create channel → 2. Confirm`,
    //       }),
    //     ],
    //   },
    // }
    msgContent = args.join(" ").trim()
  }

  const { ok, data, log, curl } = await community.setLevelMessageConfig({
    guild_id: message.guildId,
    message: msgContent,
    channel_id,
    image_url,
  })

  if (!ok) {
    throw new APIError({ message, curl, description: log })
  }

  const embed = composeEmbedMessage(null, {
    title: `${getEmoji("approve")} Successfully set leveled-up message`,
    description: `${getEmoji(
      "pointingright"
    )} You can take a look at the preview message:\n${data.message}`,
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
