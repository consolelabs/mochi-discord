import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import { APIError, GuildIdNotFoundError, InternalError } from "errors"
import { RequestConfigRepostReactionConversation } from "types/common"
import { getEmoji } from "utils/common"
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
        throw new APIError({ msgOrInteraction: msg, curl, description: log })
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
        msgOrInteraction: msg,
        title: "Unsuccessful",
        description: `You haven't configured this emoji in the starboard.\n\n${getEmoji(
          "ANIMATED_POINTING_RIGHT", true
        )} To set a new one, run \`\`\`$sb set <quantity> <emoji> <channel>\`\`\``,
      })
    }
    if (!ok) {
      throw new APIError({ msgOrInteraction: msg, curl, description: log })
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
