import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, GuildIdNotFoundError } from "errors"
import { RequestConfigRepostReactionConversation } from "types/common"

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
    const { isEmoji, isNativeEmoji, isAnimatedEmoji, value } =
      parseDiscordToken(reaction)
    let isValidEmoji = isEmoji || isNativeEmoji || isAnimatedEmoji
    msg.guild?.emojis.cache.forEach((e) => {
      if (value.includes(e.name!.toLowerCase())) {
        isValidEmoji = isValidEmoji && true
      }
    })
    if (!isValidEmoji) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Emoji ${value} is invalid or not owned by this guild`,
            }),
          ],
        },
      }
    }

    if (args.length === 4) {
      const emojiStop = args[3]
      const { isEmoji, isNativeEmoji, isAnimatedEmoji, value } =
        parseDiscordToken(emojiStop)
      let isValidEmojiStop = isEmoji || isNativeEmoji || isAnimatedEmoji
      msg.guild?.emojis.cache.forEach((e) => {
        if (value.includes(e.name!.toLowerCase())) {
          isValidEmojiStop = isValidEmojiStop && true
        }
      })
      if (!isValidEmojiStop) {
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                msg,
                description: `Emoji ${value} is invalid or not owned by this guild`,
              }),
            ],
          },
        }
      }
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

    const { ok, log, curl } = await config.removeSpecificRepostReactionConfig(
      requestData
    )
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
