import { Command, RepostReactionRequest } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { Message } from "discord.js"
import config from "adapters/config"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { GuildIdNotFoundError, InternalError, APIError } from "errors"
import { throwOnInvalidEmoji } from "utils/emoji"
import { getEmoji } from "utils/common"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_STARBOARD,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { SendActivityMsg } from "utils/activity"

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
        msgOrInteraction: msg,
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
        msgOrInteraction: msg,
        title: "Invalid channel",
        description: `Your channel is invalid. Make sure that the channel exists, or that you have entered it correctly.\n\n${getEmoji(
          "POINTINGRIGHT"
        )} Type \`#\` to see the channel list. \n${getEmoji(
          "POINTINGRIGHT"
        )} To add a new channel: 1. Create channel → 2. Confirm`,
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
      // send activity
      const channel = msg?.guild?.channels.cache.get(channelId)
      const dataProfile = await profile.getByDiscord(msg.author.id)
      if (dataProfile.err) {
        throw new APIError({
          msgOrInteraction: msg,
          description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
          curl: "",
        })
      }
      const kafkaMsg: KafkaQueueActivityDataCommand = {
        platform: "discord",
        activity: {
          profile_id: dataProfile.id,
          status: MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
          platform: MOCHI_APP_SERVICE,
          action: MOCHI_ACTION_STARBOARD,
          content: {
            username: "",
            amount: "",
            token: "",
            server_name: "",
            number_of_user: "",
            role_name: "",
            channel_name: channel?.name,
            token_name: "",
            moniker_name: "",
            address: "",
          },
        },
      }
      SendActivityMsg(kafkaMsg)
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
          description: `*Note:\n${getEmoji(
            "POINTINGRIGHT"
          )} Please use the **custom emoji from this server** and the **Discord default emoji**.*`,
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
