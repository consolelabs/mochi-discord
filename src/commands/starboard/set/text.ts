import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "discord/embed/ui"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GuildIdNotFoundError, InternalError } from "errors"
import { throwOnInvalidEmoji } from "utils/emoji"
import { defaultEmojis } from "utils/common"

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
    const quantity = +args[2]
    if (
      Number.isNaN(quantity) ||
      quantity <= 0 ||
      quantity >= Infinity ||
      quantity !== Math.floor(quantity)
    ) {
      throw new InternalError({
        message: msg,
        title: "Command error",
        description: "The amount is invalid. Please insert a natural number.",
      })
    }

    // Validate input reaction emoji
    const reaction = args[3]
    throwOnInvalidEmoji(reaction, msg)

    const { isChannel, value: channelId } = parseDiscordToken(args[4])
    if (!isChannel) {
      throw new InternalError({
        message: msg,
        title: "Invalid channel",
        description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n\n${defaultEmojis.POINT_RIGHT} Type \`#\` to see the channel list. \n${defaultEmojis.POINT_RIGHT} To add a new channel: 1. Create channel → 2. Confirm`,
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
