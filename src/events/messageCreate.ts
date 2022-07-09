import { Message } from "discord.js"
import handlePrefixedCommand from "../commands"
import { LOG_CHANNEL_ID } from "../env"
import { PREFIX, VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import { Event } from "."
import { logger } from "../logger"
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import webhook from "adapters/webhook"
import { MessageTypes } from "discord.js/typings/enums"
// import { handlePlayTripod } from "commands/games/tripod"

export const handleNormalMessage = async (message: Message) => {
  if (message.channel.type === "DM") return

  const messageType = VALID_BOOST_MESSAGE_TYPES.includes(message.type)
    ? MessageTypes["USER_PREMIUM_GUILD_SUBSCRIPTION"]
    : MessageTypes["DEFAULT"]
  const resp = await webhook.pushDiscordWebhook("messageCreate", {
    author: {
      id: message.author.id,
    },
    guild_id: message.guildId,
    channel_id: message.channelId,
    timestamp: message.createdAt,
    content: message.content,
    type: messageType,
  })

  if (resp.error !== undefined) {
    logger.error(`failed to handle webhook: ${resp.error}`)
  }
}

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Message) => {
    if (message.channel.id === LOG_CHANNEL_ID || message.author.bot) return

    try {
      if (message.content.startsWith(PREFIX)) {
        // disable previous command choice handler before executing new command
        const key = `${message.author.id}_${message.guildId}_${message.channelId}`
        CommandChoiceManager.remove(key)
        await handlePrefixedCommand(message)
        return
      }
      await handleNormalMessage(message)
      // handlePlayTripod(message)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"messageCreate">
