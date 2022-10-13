import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import { GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "starboard_set_start_stop",
  command: "set-start-stop",
  brief: "Set or update a starboard configuration start stop",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    // Validate input reaction emoji start
    let reactionStart = args[2]
    let isValidEmojiStart = false
    if (reactionStart.startsWith("<:") && reactionStart.endsWith(">")) {
      reactionStart = reactionStart.toLowerCase()
    }
    const emojiStartSplit = reactionStart.split(":")
    if (emojiStartSplit.length === 1) {
      isValidEmojiStart = true
    }
    msg.guild?.emojis.cache.forEach((e) => {
      if (emojiStartSplit.includes(e.name!.toLowerCase())) {
        isValidEmojiStart = true
      }
    })
    if (!isValidEmojiStart) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Emoji ${reactionStart} is invalid or not owned by this guild`,
            }),
          ],
        },
      }
    }

    // Validate input reaction emoji stop
    let reactionStop = args[3]
    let isValidEmojiStop = false
    if (reactionStop.startsWith("<:") && reactionStop.endsWith(">")) {
      reactionStop = reactionStop.toLowerCase()
    }
    const emojiStopSplit = reactionStop.split(":")
    if (emojiStopSplit.length === 1) {
      isValidEmojiStop = true
    }
    msg.guild?.emojis.cache.forEach((e) => {
      if (emojiStopSplit.includes(e.name!.toLowerCase())) {
        isValidEmojiStop = true
      }
    })
    if (!isValidEmojiStop) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Emoji ${reactionStop} is invalid or not owned by this guild`,
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

    const requestData = {
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
          usage: `${PREFIX}sb set-start-stop <emoji-start> <emoji-stop> <channel>`,
          examples: `${PREFIX}sb set-start-stop <:stonks_up:> <:stonks_down:> #starboard `,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 5,
}

export default command
