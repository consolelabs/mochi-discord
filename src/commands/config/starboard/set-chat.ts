import { Command, RequestConfigRepostReactionConversation } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "starboard_set_chat",
  command: "set-chat",
  brief: "Set or update a conversation bookmark.",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    // Validate input reaction emoji start
    const reactionStart = args[2]
    const {
      isEmoji: isEmojiStart,
      isNativeEmoji: isNativeEmojiStart,
      isAnimatedEmoji: isAnimatedEmojiStart,
      value: valueStart,
    } = parseDiscordToken(reactionStart)
    let isValidEmojiStart =
      isEmojiStart || isNativeEmojiStart || isAnimatedEmojiStart

    msg.guild?.emojis.cache.forEach((e) => {
      if (valueStart.includes(e.name!.toLowerCase())) {
        isValidEmojiStart = isValidEmojiStart && true
      }
    })
    if (!isValidEmojiStart) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Emoji ${valueStart} is invalid or not owned by this guild`,
            }),
          ],
        },
      }
    }

    // Validate input reaction emoji stop
    const reactionStop = args[3]
    const {
      isEmoji: isEmojiStop,
      isNativeEmoji: isNativeEmojiStop,
      isAnimatedEmoji: isAnimatedEmojiStop,
      value: valueStop,
    } = parseDiscordToken(reactionStop)
    let isValidEmojiStop =
      isEmojiStop || isNativeEmojiStop || isAnimatedEmojiStop

    msg.guild?.emojis.cache.forEach((e) => {
      if (valueStop.includes(e.name!.toLowerCase())) {
        isValidEmojiStop = isValidEmojiStop && true
      }
    })
    if (!isValidEmojiStop) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Emoji ${valueStop} is invalid or not owned by this guild`,
            }),
          ],
        },
      }
    }

    // Validate repost_channel_id args
    const channelId = args[4].replace(/\D/g, "")
    const channel = await msg.guild?.channels.fetch(channelId)
    if (!channel || !channelId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description:
                "Cannot find a channel that match to your input channel ID.",
            }),
          ],
        },
      }
    }

    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
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
