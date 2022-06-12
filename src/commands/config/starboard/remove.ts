import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "starboard_remove",
  command: "remove",
  brief: "Remove an starboard configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    if (args.length !== 3) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              usage: `${PREFIX}sb remove <emoji>`,
              examples: `${PREFIX}sb remove ⭐`,
            }),
          ],
        },
      }
    }

    // Validate input reaction emoji
    let reaction = args[2]
    let isValidEmoji = false
    if (reaction.startsWith("<:") && reaction.endsWith(">")) {
      reaction = reaction.toLowerCase()
    }
    const emojiSplit = reaction.split(":")
    if (emojiSplit.length === 1) {
      isValidEmoji = true
    }
    msg.guild.emojis.cache.forEach((e) => {
      if (emojiSplit.includes(e.name.toLowerCase())) {
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

    const requestData: RepostReactionRequest = {
      guild_id: msg.guild.id,
      emoji: reaction,
    }

    const res = await config.removeSpecificRepostReactionConfig(requestData)
    if (res.message === "OK") {
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
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}sb remove <emoji>`,
          examples: `${PREFIX}sb remove ⭐`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
