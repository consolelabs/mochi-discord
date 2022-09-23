import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "starboard_remove",
  command: "remove",
  brief: "Remove an starboard configuration",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    // Validate input reaction emoji
    const reaction = args[2]
    let isValidEmoji = false

    const { id } = parseDiscordToken(reaction)

    msg.guild?.emojis.cache.forEach((e) => {
      if (id == e.id) {
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

    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
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
  colorType: "Server",
  minArguments: 3,
}

export default command
