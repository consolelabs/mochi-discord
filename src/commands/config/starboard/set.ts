import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GuildIdNotFoundError, InternalError } from "errors"
import { throwOnInvalidEmoji } from "utils/emoji"

const command: Command = {
  id: "starboard_set",
  command: "set",
  brief: "Set or update a message bookmark.",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    // Validate quantity
    const quantity = Number(args[2])
    if (Number.isNaN(quantity) || quantity <= 0) {
      throw new InternalError({
        description: "Invalid quantity",
      })
    }

    // Validate input reaction emoji
    const reaction = args[3]
    throwOnInvalidEmoji(reaction, msg)

    const { isChannel, value: channelId } = parseDiscordToken(args[4])
    if (!isChannel) {
      throw new InternalError({
        message: msg,
        description:
          "Cannot find a channel that match to your input channel ID.",
      })
    }

    const requestData: RepostReactionRequest = {
      guild_id: msg.guild.id,
      emoji: reaction,
      quantity: quantity,
      repost_channel_id: channelId,
    }

    const res = await config.updateRepostReactionConfig(requestData)
    if (res.ok) {
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
          description: `*Note:\n👉 Please use the **custom emoji from this server** and the **Discord default emoji**.*`,
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
