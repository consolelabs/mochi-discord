import { Command, RequestConfigRepostReactionConversation } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GuildIdNotFoundError, InternalError } from "errors"
import { throwOnInvalidEmoji } from "utils/emoji"
import { defaultEmojis } from "utils/common"

const command: Command = {
  id: "starboard_set_chat",
  command: "set-chat",
  brief: "Set or update a conversation bookmark.",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    // Validate input reaction emoji start
    const reactionStart = args[2]
    throwOnInvalidEmoji(reactionStart, msg)

    // Validate input reaction emoji stop
    const reactionStop = args[3]
    throwOnInvalidEmoji(reactionStop, msg)

    // Validate repost_channel_id args
    const { isChannel, value: channelId } = parseDiscordToken(args[4])
    if (!isChannel) {
      throw new InternalError({
        message: msg,
        title: "Invalid channel",
        description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n\n${defaultEmojis.POINT_RIGHT} Type \`#\` to see the channel list. \n${defaultEmojis.POINT_RIGHT} To add a new channel: 1. Create channel → 2. Confirm`,
      })
    }

    const requestData: RequestConfigRepostReactionConversation = {
      guild_id: msg.guild.id,
      emoji_start: reactionStart,
      emoji_stop: reactionStop,
      repost_channel_id: channelId,
    }

    const res = await config.CreateConfigRepostReactionStartStop(requestData)
    if (res.ok) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Starboard Configuration",
              description: `Now conversation with ${reactionStart} and ${reactionStop} will be reposted to channel <#${requestData.repost_channel_id}>`,
            }),
          ],
        },
      }
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb set-chat <emoji-start> <emoji-stop> <channel>`,
          description: `*Note:\n👉 Please use the **custom emoji from this server** and the **Discord default emoji**.*`,
          examples: `${PREFIX}sb set-chat 🌟 ❣️ #starboard`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 5,
}

export default command
