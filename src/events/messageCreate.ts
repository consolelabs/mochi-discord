import { Message } from "discord.js"
import handlePrefixedCommand from "../commands"
import { PREFIX, VALID_BOOST_MESSAGE_TYPES } from "utils/constants"
import { Event } from "."
import { logger } from "../logger"
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import webhook from "adapters/webhook"
import { MessageTypes } from "discord.js/typings/enums"
import { handlePlayTripod } from "commands/games/tripod"

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
    timestamp: message.createdAt,
    content: message.content,
    type: messageType,
  }
  const msg = "messageCreate"

  const resp = await webhook.pushDiscordWebhook(msg, body)
  if (resp?.error != undefined) {
    logger.error(`failed to handle webhook: ${resp.error}`)
  }
}

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Message) => {
    // deny handling if author is bot or message is empty (new user join server)
    if (message.author.bot || !message.content) return

    try {
      if (message.content.startsWith(PREFIX)) {
        // disable previous command choice handler before executing new command
        const key = `${message.author.id}_${message.guildId}_${message.channelId}`
        CommandChoiceManager.remove(key)
        await handlePrefixedCommand(message)
        return
      }
      await handleNormalMessage(message)
      handlePlayTripod(message)
    } catch (e: any) {
      let error = e as BotBaseError

      // something went wrong
      if (!(error instanceof BotBaseError)) {
        error = new BotBaseError(message, e.message as string)
      }
      error.handle?.()
      ChannelLogger.alert(message, error)
      ChannelLogger.log(error, 'Event<"messageCreate">')
    }
  },
} as Event<"messageCreate">
