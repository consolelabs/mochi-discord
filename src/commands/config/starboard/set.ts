import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"
import { GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "starboard_set",
  command: "set",
  brief: "Set or update a starboard configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    // Validate quantity
    const quantity = parseInt(args[2])
    if (!quantity || quantity <= 0) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid quantity." })],
        },
      }
    }

    // Validate input reaction emoji
    let reaction = args[3]
    let isValidEmoji = false
    if (reaction.startsWith("<:") && reaction.endsWith(">")) {
      reaction = reaction.toLowerCase()
    }
    const emojiSplit = reaction.split(":")
    if (emojiSplit.length === 1) {
      isValidEmoji = true
    }
    msg.guild?.emojis.cache.forEach((e) => {
      if (emojiSplit.includes(e.name!.toLowerCase())) {
        isValidEmoji = true
      }
    })
    if (!isValidEmoji) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Emoji ${reaction} is invalid or not owned by this guild`,
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

    const requestData: RepostReactionRequest = {
      guild_id: msg.guild.id,
      emoji: reaction,
      quantity: quantity,
      repost_channel_id: channelId,
    }

    const res = await config.updateRepostReactionConfig(requestData)
    if (res.message === "OK") {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Starboard Configuration",
              description: `Now an article receiving ${requestData.quantity} ${requestData.emoji} will be reposted to channel <#${requestData.repost_channel_id}>`,
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
          usage: `${PREFIX}sb set <quantity> <emoji> <channel>`,
          examples: `${PREFIX}sb set 3 ⭐ #starboard`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 5,
}

export default command
