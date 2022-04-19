import { Message } from "discord.js"
import handleCommand from "../commands"
import { LOG_CHANNEL_ID } from "../env"
import { PREFIX, SPACE } from "utils/constants"
import { Event } from "."
import { logger } from "../logger"
import { BotBaseError } from "errors"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"
import { isGmMessage } from "utils/common"

const allowedDMCommands = ["deposit"].map((c) => `${PREFIX}${c}`)
function normalizeCommand(message: Message) {
  return message.content.replace(/  +/g, " ").trim().toLowerCase()
}

function isInBotCommandScopes(message: Message) {
  if (message.channel.type !== "DM") {
    return isGmMessage(message) || message.content.startsWith(PREFIX)
  }
  return (
    message.channel.type === "DM" &&
    allowedDMCommands.includes(message.content.split(SPACE)[0])
  )
}

export default {
  name: "messageCreate",
  once: false,
  execute: async (message: Message) => {
    message.content = normalizeCommand(message)
    if (
      message.channel.id === LOG_CHANNEL_ID ||
      message.author.bot ||
      !isInBotCommandScopes(message)
    )
      return

    try {
      // disable previous command choice handler before executing new command
      if (message.channel.type !== "DM") {
        const key = `${message.author.id}_${message.guildId}_${message.channelId}`
        CommandChoiceManager.remove(key)
      }
      await handleCommand(message)
    } catch (e: any) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e)
      }
      ChannelLogger.log(error)
    }
  },
} as Event<"messageCreate">
