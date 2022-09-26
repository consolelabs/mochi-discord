import { Message } from "discord.js"
import { VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import { Event } from "."
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import webhook from "adapters/webhook"
import { MessageTypes } from "discord.js/typings/enums"

export const handleNormalMessage = async (message: Message) => {
  if (message.channel.type === "DM") return

  const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
    ? MessageTypes["USER_PREMIUM_GUILD_SUBSCRIPTION"]
    : MessageTypes["DEFAULT"]
  const body = {
    author: {
      id: message.author.id,
      avatar: message.author.avatarURL(),
      username: message.author.username,
    },
    guild_id: message.guildId,
    channel_id: message.channelId,
    timestamp: message.createdAt.toISOString(),
    content: message.content,
    type: messageType,
  }

  await webhook.pushDiscordWebhook("messageDelete", body)
}

export default {
  name: "messageDelete",
  once: false,
  execute: async (message: Message) => {
    try {
      const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
        ? MessageTypes["USER_PREMIUM_GUILD_SUBSCRIPTION"]
        : MessageTypes["DEFAULT"]
      const body = {
        author: {
          id: message.author.id,
          avatar: message.author.avatarURL(),
          username: message.author.username,
        },
        id: message.id,
        guild_id: message.guildId,
        channel_id: message.channelId,
        timestamp: message.createdAt.toISOString(),
        content: message.content,
        type: messageType,
      }

      await webhook.pushDiscordWebhook("messageDelete", body)
    } catch (e: any) {
      let error = e as BotBaseError

      // something went wrong
      if (!(error instanceof BotBaseError)) {
        error = new BotBaseError(message, e.message as string)
      }
      error.handle?.()
      ChannelLogger.alert(message, error)
      ChannelLogger.log(error, 'Event<"messageDelete">')
    }
  },
} as Event<"messageDelete">
