import { Message } from "discord.js"
import handlePrefixedCommand from "../commands"
import { PREFIX, VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import webhook from "adapters/webhook"
import { MessageTypes } from "discord.js/typings/enums"
import { handlePlayTripod } from "commands/games/tripod"
import { DiscordEvent } from "./index"
import { wrapError } from "utils/wrapError"
import ConversationManager from "utils/ConversationManager"
import { kafkaQueue } from "index"
import { KafkaQueueMessage } from "../types/common"
import { logger } from "logger"

export const handleNormalMessage = async (message: Message) => {
  if (message.channel.type === "DM") return

  const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
    ? MessageTypes["USER_PREMIUM_GUILD_SUBSCRIPTION"]
    : MessageTypes["DEFAULT"]

  const stickers = Array.from(message.stickers.values())

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
    sticker_items: stickers,
    type: messageType,
  }

  await webhook.pushDiscordWebhook("messageCreate", body)
}

const events: DiscordEvent<"messageCreate"> = {
  name: "messageCreate",
  once: false,
  execute: async (message) => {
    // keep outside wrapErr() to prevent sending error msg to discord
    if (message.content.startsWith(PREFIX)) {
      try {
        const kafkaMsg: KafkaQueueMessage = {
          platform: "discord",
          data: message,
        }
        await kafkaQueue?.produceBatch([JSON.stringify(kafkaMsg)])
      } catch (error) {
        logger.error("[KafkaQueue] - failed to enqueue")
      }
    }
    // deny handling if author is bot or message is empty (new user join server)
    wrapError(message, async () => {
      if (message.author.bot || (!message.content && !message.stickers.size))
        return
      if (message.content.startsWith(PREFIX)) {
        await handlePrefixedCommand(message)
        return
      }
      await handleNormalMessage(message)
      if (
        ConversationManager.hasConversation(
          message.author.id,
          message.channelId
        )
      ) {
        ConversationManager.continueConversation(
          message.author.id,
          message.channelId,
          message
        )
      } else {
        handlePlayTripod(message)
      }
    })
  },
}

export default events
