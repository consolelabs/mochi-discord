import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { RequestConfigRepostReactionConversation } from "types/common"
import { defaultEmojis, emojis, getEmojiURL } from "utils/common"
import { throwOnInvalidEmoji } from "utils/emoji"

const command: Command = {
  id: "starboard_remove",
  command: "remove",
  brief: "Remove a bookmark from the starboard.",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    // Validate input reaction emoji
    const reaction = args[2]
    throwOnInvalidEmoji(reaction, msg)

    if (args.length === 4) {
      const emojiStop = args[3]
      throwOnInvalidEmoji(reaction, msg)
      const requestData: RequestConfigRepostReactionConversation = {
        guild_id: msg.guild.id,
        emoji_start: reaction,
        emoji_stop: emojiStop,
      }
      const { ok, log, curl } =
        await config.removeRepostReactionConversationConfig(requestData)
      if (!ok) {
        throw new APIError({ message: msg, curl, description: log })
      }
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Starboard Configuration",
              description: `Emoji ${requestData.emoji_start} and ${requestData.emoji_stop} are now unset.`,
            }),
          ],
        },
      }
    }

    const requestData: RepostReactionRequest = {
      guild_id: msg.guild.id,
      emoji: reaction,
    }

    const { ok, log, curl, status } =
      await config.removeSpecificRepostReactionConfig(requestData)
    if (!ok && status === 404) {
      throw new InternalError({
        message: msg,
        title: "Remove a starboard config",
        description: `The emoji didn't exist.\n${defaultEmojis.POINT_RIGHT} To check emojis in the starboard list, run \`$sb list\`.\n${defaultEmojis.POINT_RIGHT} To set a new starboard, run \`$sb set <quantity> <emoji> <#channel>\` or \`$sb set-chat <start_emoji> <stop_emoji> <#channel>\`.`,
        emojiUrl: getEmojiURL(emojis.FELLOWSHIP),
      })
    }
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "Starboard Configuration",
            description: `Emoji ${requestData.emoji} is now unset.`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb remove <emoji>\n${PREFIX}sb remove <emoji-start> <emoji-stop>`,
          examples: `${PREFIX}sb remove ⭐\n${PREFIX}sb remove 🌟 ❣️`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
