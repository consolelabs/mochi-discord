import { Message } from "discord.js"
import handlePrefixedCommand from "../commands"
import { LOG_CHANNEL_ID } from "../env"
import { PREFIX } from "utils/constants"
import { Event } from "."
import { logger } from "../logger"
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import webhook from "adapters/webhook"

function normalizeCommand(message: Message) {
  return message.content
    .replace(/  +/g, " ")
    .trim()
    .toLowerCase()
}

export const handleNormalMessage = async (message: Message) => {
  const resp = await webhook.pushDiscordWebhook("messageCreate", {
    author: {
      id: message.author.id
    },
    guild_id: message.guildId,
    channel_id: message.channelId,
    timestamp: message.createdAt,
    content: message.content
  })

  if (resp.status !== "OK" || resp.error !== undefined) {
    logger.error(resp.error)
    throw new BotBaseError(message)
  }

  const { data, type } = resp
  if (!type || !data) return

  switch (type) {
    case "level_up":
      if (data.level_up) {
        await message.channel.send(
          `GG <@${message.author.id}>, you just advanced to level ${data.current_level}`
        )
      }
      return
    default:
      return
  }
}

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Message) => {
    message.content = normalizeCommand(message)
    if (
      message.channel.id === LOG_CHANNEL_ID ||
      message.author.bot ||
      message.channel.type === "DM"
    )
      return

    try {
      if (message.content.startsWith(PREFIX)) {
        // disable previous command choice handler before executing new command
        const key = `${message.author.id}_${message.guildId}_${message.channelId}`
        CommandChoiceManager.remove(key)
        await handlePrefixedCommand(message)
        return
      }
      await handleNormalMessage(message)
    } catch (e: any) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(error)
    }
  }
} as Event<"messageCreate">
